from django.test import TestCase, Client
from django.contrib.auth.models import User
from .models import ChatMessage

class ChatAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.client.login(username="testuser", password="testpass")

    def test_chat_message_creation(self):
        response = self.client.post('/api/chat/', {
            "message": "Математика – 180, Українська мова – 190"
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('bot_response', response.json())

    def test_chat_history(self):
        ChatMessage.objects.create(
            user=self.user,
            user_message="Test",
            bot_response="Response"
        )
        response = self.client.get('/api/history/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('history', response.json())
