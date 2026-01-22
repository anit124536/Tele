import telebot
from telebot import types
import os

# Render-এর Environment Variables থেকে টোকেন নেবে
API_TOKEN = os.getenv('BOT_TOKEN') 
BLOGGER_URL = "https://yourblog.blogspot.com" 

bot = telebot.TeleBot(API_TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    user_id = message.from_user.id
    first_name = message.from_user.first_name
    username = message.from_user.username if message.from_user.username else "User"
    
    webapp_url = f"{BLOGGER_URL}/?id={user_id}&name={first_name}&username={username}"
    
    markup = types.InlineKeyboardMarkup()
    button = types.InlineKeyboardButton(text="Open App 🚀", web_app=types.WebAppInfo(url=webapp_url))
    markup.add(button)
    
    bot.send_message(message.chat.id, f"Hello {first_name}! Welcome to our app.", reply_markup=markup)

bot.infinity_polling()

