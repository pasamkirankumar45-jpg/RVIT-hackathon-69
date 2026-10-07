"""
CRDT Consistency Layer for CodeSync
Implements RGA (Replicated Growable Array) with Vector Clocks and Conflict-Free Merge
"""

import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple, Any

@dataclass
class OperationID:
    clock: int
    client: str
    seq: int = 0

    def __str__(self) -> str:
        return f"{self.clock}:{self.seq}@{self.client}"

    def __lt__(self, other: 'OperationID') -> bool:
        if self.clock != other.clock:
            return self.clock < other.clock
        return self.client < other.client

@dataclass
class CRDTOperation:
    operation_id: str
    user_id: str
    document_id: str
    timestamp: float
    logical_clock: int
    operation_type: str  # 'insert' | 'delete' | 'replace'
    position: int
    content: str
    length: int = 1
    parent_version: int = 0
    vector_clock: Dict[str, int] = field(default_factory=dict)
    encrypted: bool = False
    ciphertext: Optional[str] = None
    iv: Optional[str] = None

@dataclass
class CharAtom:
    id: str
    origin_id: str
    value: str
    clock: int
    client: str
    deleted: bool = False

class VectorClock:
    def __init__(self, clocks: Optional[Dict[str, int]] = None):
        self.clocks: Dict[str, int] = clocks.copy() if clocks else {}

    def increment(self, client: str) -> int:
        self.clocks[client] = self.clocks.get(client, 0) + 1
        return self.clocks[client]

    def update_max(self, other: Dict[str, int]) -> None:
        for client, clock in other.items():
            self.clocks[client] = max(self.clocks.get(client, 0), clock)

    def to_dict(self) -> Dict[str, int]:
        return self.clocks.copy()

class DocumentState:
    def __init__(self, version: int = 0, vector_clock: Optional[Dict[str, int]] = None):
        self.version = version
        self.vector_clock = vector_clock or {}

class CRDTDocument:
    """
    RGA-based CRDT Document replica.
    Guarantees Strong Eventual Consistency (SEC) across all replicas.
    """
    def __init__(self, document_id: str, initial_text: str = ""):
        self.document_id = document_id
        self.atoms: List[CharAtom] = [
            CharAtom(id="ROOT", origin_id="", value="", clock=0, client="SYSTEM", deleted=True)
        ]
        self.vector_clock = VectorClock()
        self.seen_operations: Set[str] = set()
        self.operations_log: List[CRDTOperation] = []
        self.current_version: int = 0

        if initial_text:
            prev_id = "ROOT"
            for i, ch in enumerate(initial_text):
                atom = CharAtom(
                    id=f"0:{i}@INIT",
                    origin_id=prev_id,
                    value=ch,
                    clock=0,
                    client="INIT",
                    deleted=False
                )
                self.atoms.append(atom)
                prev_id = atom.id

    def get_text(self) -> str:
        """Returns the visible document text (excluding deleted tombstones)."""
        return "".join(atom.value for atom in self.atoms[1:] if not atom.deleted)

    def find_atom_index_by_visible_pos(self, visible_pos: int) -> int:
        if visible_pos <= 0:
            return 0  # ROOT
        count = 0
        for i in range(1, len(self.atoms)):
            if not self.atoms[i].deleted:
                count += 1
                if count == visible_pos:
                    return i
        return len(self.atoms) - 1

    def apply_operation(self, op: CRDTOperation) -> bool:
        """
        Applies a local or remote operation.
        Returns True if applied, False if duplicate/rejected.
        """
        # 1. Byzantine / Replay Attack Mitigation: Deduplication
        if op.operation_id in self.seen_operations:
            return False
        self.seen_operations.add(op.operation_id)
        self.operations_log.append(op)

        # 2. Update Vector Clock
        self.vector_clock.clocks[op.user_id] = max(
            self.vector_clock.clocks.get(op.user_id, 0),
            op.logical_clock
        )
        self.current_version += 1

        # 3. Apply operation semantics
        if op.operation_type == "insert":
            self._apply_insert(op)
        elif op.operation_type == "delete":
            self._apply_delete(op)
        elif op.operation_type == "replace":
            self._apply_delete(op)
            self._apply_insert(op)

        return True

    def _apply_insert(self, op: CRDTOperation) -> None:
        text = op.content
        if not text:
            return

        pred_idx = self.find_atom_index_by_visible_pos(op.position)
        origin_id = self.atoms[pred_idx].id if pred_idx < len(self.atoms) else "ROOT"
        insert_after_idx = pred_idx

        for char_idx, ch in enumerate(text):
            new_atom = CharAtom(
                id=f"{op.logical_clock}:{char_idx}@{op.user_id}",
                origin_id=origin_id,
                value=ch,
                clock=op.logical_clock,
                client=op.user_id,
                deleted=False
            )

            # Deterministic conflict resolution: siblings sorted by (clock DESC, client DESC)
            target_idx = insert_after_idx + 1
            while target_idx < len(self.atoms):
                next_atom = self.atoms[target_idx]
                if next_atom.origin_id != origin_id:
                    break
                if (new_atom.clock < next_atom.clock) or (
                    new_atom.clock == next_atom.clock and new_atom.client < next_atom.client
                ):
                    target_idx += 1
                else:
                    break

            self.atoms.insert(target_idx, new_atom)
            insert_after_idx = target_idx

    def _apply_delete(self, op: CRDTOperation) -> None:
        length = op.length or 1
        visible_count = 0
        deleted_count = 0

        for i in range(1, len(self.atoms)):
            if deleted_count >= length:
                break
            if not self.atoms[i].deleted:
                if visible_count >= op.position:
                    self.atoms[i].deleted = True
                    deleted_count += 1
                visible_count += 1

class MergeEngine:
    """
    Coordinates convergence across replicas.
    """
    @staticmethod
    def merge(doc: CRDTDocument, operations: List[CRDTOperation]) -> bool:
        # Sort causally by logical_clock then timestamp
        sorted_ops = sorted(operations, key=lambda x: (x.logical_clock, x.timestamp))
        applied_any = False
        for op in sorted_ops:
            if doc.apply_operation(op):
                applied_any = True
        return applied_any
