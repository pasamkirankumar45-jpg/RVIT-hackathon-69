import json
import time
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .crdt import CRDTDocument, CRDTOperation

class CollaborationConsumer(AsyncJsonWebsocketConsumer):
    # In-memory document replicas mapped by file_id
    document_replicas = {}

    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.file_id = self.scope['url_route']['kwargs']['file_id']
        self.room_group_name = f"collab_{self.project_id}_{self.file_id}"
        self.user = self.scope.get('user', None)
        self.user_id = str(self.user.id) if self.user and self.user.is_authenticated else f"anon_{int(time.time())}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        if self.file_id not in self.document_replicas:
            self.document_replicas[self.file_id] = CRDTDocument(self.file_id)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Broadcast user left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'event': {
                    'type': 'user_left',
                    'userId': self.user_id,
                }
            }
        )

    async def receive_json(self, content):
        event_type = content.get('type')
        doc = self.document_replicas.get(self.file_id)

        if event_type == 'join_room':
            await self.send_json({
                'type': 'sync_response',
                'fileId': self.file_id,
                'currentContent': doc.get_text() if doc else '',
                'vectorClock': doc.vector_clock.to_dict() if doc else {},
            })
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': {
                        'type': 'user_joined',
                        'user': {
                            'userId': content.get('userId', self.user_id),
                            'username': content.get('username', 'Developer'),
                            'avatarColor': content.get('avatarColor', '#10b981'),
                            'fileId': self.file_id,
                        }
                    }
                }
            )

        elif event_type == 'document_update':
            op_data = content.get('operation', {})
            op = CRDTOperation(
                operation_id=op_data.get('operation_id'),
                user_id=op_data.get('user_id'),
                document_id=self.file_id,
                timestamp=op_data.get('timestamp', time.time()),
                logical_clock=op_data.get('logical_clock', 1),
                operation_type=op_data.get('operation_type', 'insert'),
                position=op_data.get('position', 0),
                content=op_data.get('content', ''),
                length=op_data.get('length', 1),
            )

            # Apply operation to server replica
            applied = doc.apply_operation(op) if doc else True
            if applied:
                # Broadcast operation to peers
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'broadcast_event',
                        'sender_channel': self.channel_name,
                        'event': {
                            'type': 'document_update',
                            'operation': op_data,
                            'fullContent': content.get('fullContent'),
                            'vectorClock': doc.vector_clock.to_dict() if doc else {},
                        }
                    }
                )

        elif event_type == 'cursor_update':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'sender_channel': self.channel_name,
                    'event': content
                }
            )

        elif event_type == 'ping':
            await self.send_json({'type': 'pong', 'timestamp': time.time()})

    async def broadcast_event(self, event):
        sender = event.get('sender_channel')
        # Do not echo back to sender if sender_channel is specified
        if sender != self.channel_name:
            await self.send_json(event['event'])
