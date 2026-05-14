from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY in .env")

    return genai.Client(api_key=api_key)


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
        client = get_gemini_client()

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        return jsonify({
            "reply": response.text
        })

    except Exception as e:
        return jsonify({
            "error": "Chatbot failed",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)