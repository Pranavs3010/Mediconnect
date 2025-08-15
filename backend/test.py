import requests

def send_simple_message():
    response = requests.post(
        "https://api.mailgun.net/v3/sandboxc15bf2a8ce1b4c53b58d03c270e6c30d.mailgun.org/messages",
        auth=("api", "31794b1753690b1209881a81dca0a041-16bc1610-9e81e4f6"),
        data={
            "from": "Mailgun Sandbox <postmaster@sandboxc15bf2a8ce1b4c53b58d03c270e6c30d.mailgun.org>",
            "to": "Pranav Venkatesh Shinde <pranavs3010@gmail.com>",
            "subject": "Hello Pranav Venkatesh Shinde",
            "text": "Congratulations Pranav Venkatesh Shinde, you just sent an email with Mailgun! You are truly awesome!"
        }
    )
    print("Status Code:", response.status_code)
    print("Response Body:", response.text)

send_simple_message()
