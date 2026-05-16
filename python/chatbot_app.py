from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path
import requests
import os

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return render_template("chatbot.html")


@app.route("/chat", methods=["GET", "POST"])
@app.route("/chatbot/message", methods=["GET", "POST"])
def chatbot_message():
    if request.method == "GET":
        return jsonify({
            "status": "chatbot route is working"
        })
    
    data = request.get_json()

    if not data or not data.get("message"):
        return jsonify({"error": "message is required"}), 400

    user_message = data["message"]

    prompt = f"""
אתה עוזר AI פנימי במערכת ליווי סטודנטים עבור רכזת מילואים.

המשתמשת במערכת היא רכזת מילואים, ולכן כל תשובה צריכה להיות מופנית אליה בלבד.
אין לפנות ישירות לסטודנט, אלא אם אתה מציע לרכזת נוסח אפשרי לשליחה אליו.

מטרתך היא לסייע לרכזת:
- להבין את מצב הפנייה.
- לסווג את סוג הבעיה.
- לזהות רמת דחיפות.
- להבין איזה מידע חסר.
- להחליט מה הצעד הבא בטיפול.
- להמליץ על גורם מתאים להמשך טיפול.
- להכין נוסח אפשרי לתגובה לסטודנט.

סוגי פניות אפשריים:
- היעדרות עקב מילואים
- דחיית הגשה
- בקשה למועד מיוחד
- השלמת חומר לימודי
- קושי מול מרצה
- עומס לימודי לאחר חזרה ממילואים
- בקשה להתאמות
- צורך בליווי אישי
- מצוקה חריגה או צורך בהפניה לגורם נוסף

כללים חשובים:
- אל תקבל החלטות סופיות במקום הרכזת.
- אל תאשר זכויות, התאמות, מועדים או חריגים באופן סופי.
- אל תמציא נהלים שאינם מופיעים במידע הקיים.
- אל תאבחן מצב רפואי או נפשי.
- אם חסר מידע, ציין במפורש מה צריך לברר.
- אם יש חשש למצוקה חריפה, המלץ לרכזת להפנות לגורם מקצועי מתאים.
- ענה בעברית, בטון מקצועי, ברור ותכליתי.

החזר תשובה במבנה הבא:

סיכום הפנייה:
...

סיווג הפנייה:
...

רמת דחיפות:
נמוכה / בינונית / גבוהה

מידע חסר:
...

המלצה לרכזת:
...

גורם מומלץ להמשך טיפול:
...

נוסח אפשרי לשליחה לסטודנט:
...

המידע שהוזן על ידי הרכזת:
{user_message}
"""

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        res = requests.post(url, json=payload)
        res.raise_for_status()
        reply = res.json()["candidates"][0]["content"]["parts"][0]["text"]

        return jsonify({
            "reply": reply
        })

    except Exception as e:
        return jsonify({
            "error": "Chatbot failed",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)