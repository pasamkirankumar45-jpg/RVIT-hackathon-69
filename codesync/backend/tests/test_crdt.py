import pytest
import time
from collaboration.crdt import CRDTDocument, CRDTOperation, MergeEngine

def test_single_replica_insert():
    doc = CRDTDocument("doc1", "hello")
    assert doc.get_text() == "hello"

    op = CRDTOperation(
        operation_id="op_1",
        user_id="user_a",
        document_id="doc1",
        timestamp=time.time(),
        logical_clock=1,
        operation_type="insert",
        position=5,
        content=" world",
    )
    applied = doc.apply_operation(op)
    assert applied is True
    assert doc.get_text() == "hello world"

def test_duplicate_operation_rejection():
    doc = CRDTDocument("doc1", "base")
    op = CRDTOperation(
        operation_id="op_dup_1",
        user_id="user_a",
        document_id="doc1",
        timestamp=time.time(),
        logical_clock=1,
        operation_type="insert",
        position=4,
        content="!",
    )
    assert doc.apply_operation(op) is True
    # Replay identical operation ID
    assert doc.apply_operation(op) is False
    assert doc.get_text() == "base!"

def test_concurrent_3way_merge_convergence():
    initial = "def solve():\n    pass"
    doc_a = CRDTDocument("doc_c", initial)
    doc_b = CRDTDocument("doc_c", initial)
    doc_c = CRDTDocument("doc_c", initial)

    op_a = CRDTOperation(
        operation_id="op_a_1",
        user_id="client_a",
        document_id="doc_c",
        timestamp=time.time(),
        logical_clock=1,
        operation_type="insert",
        position=16,
        content="\n    x = 1",
    )
    op_b = CRDTOperation(
        operation_id="op_b_1",
        user_id="client_b",
        document_id="doc_c",
        timestamp=time.time(),
        logical_clock=1,
        operation_type="insert",
        position=16,
        content="\n    y = 2",
    )
    op_c = CRDTOperation(
        operation_id="op_c_1",
        user_id="client_c",
        document_id="doc_c",
        timestamp=time.time(),
        logical_clock=1,
        operation_type="insert",
        position=16,
        content="\n    z = 3",
    )

    # Local application
    doc_a.apply_operation(op_a)
    doc_b.apply_operation(op_b)
    doc_c.apply_operation(op_c)

    # Cross merge with different delivery orders
    MergeEngine.merge(doc_a, [op_b, op_c])
    MergeEngine.merge(doc_b, [op_c, op_a])
    MergeEngine.merge(doc_c, [op_a, op_b])

    # Assert Strong Eventual Consistency
    assert doc_a.get_text() == doc_b.get_text()
    assert doc_b.get_text() == doc_c.get_text()
