# -*- coding: utf-8 -*-
import os
from flask import Flask, render_template, request, redirect, url_for, session
from werkzeug.utils import secure_filename

from store import load_content, save_content

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "webddk-admin-secret-change-in-production")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB for uploads

ADMIN_USER = "sr-admin"
ADMIN_PASS = "sr0215"
DOCS_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "docs")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def admin_required(f):
    from functools import wraps
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return wrapped


@app.route("/")
def index():
    data = load_content()
    return render_template("index.html", programs=data.get("programs", []))


@app.route("/about")
def about():
    data = load_content()
    return render_template("about.html", about_html=data.get("about", ""))


@app.route("/documents")
def documents():
    data = load_content()
    return render_template(
        "documents.html",
        documents=data.get("documents", []),
        requisites=data.get("requisites", {}),
    )


@app.route("/contact")
def contact():
    return render_template("contact.html")


# --- Admin: login ---
@app.route("/admin", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        user = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if user == ADMIN_USER and password == ADMIN_PASS:
            session["admin_logged_in"] = True
            return redirect(url_for("admin_dashboard"))
    if session.get("admin_logged_in"):
        return redirect(url_for("admin_dashboard"))
    return render_template("admin/login.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))


@app.route("/admin/dashboard")
@admin_required
def admin_dashboard():
    return render_template("admin/dashboard.html")


# --- Admin: О компании ---
@app.route("/admin/about", methods=["GET", "POST"])
@admin_required
def admin_about():
    if request.method == "POST":
        data = load_content()
        data["about"] = request.form.get("about", "")
        save_content(data)
        return redirect(url_for("admin_dashboard"))
    data = load_content()
    return render_template("admin/about_edit.html", about=data.get("about", ""))


# --- Admin: Документы ---
@app.route("/admin/documents", methods=["GET", "POST"])
@admin_required
def admin_documents():
    data = load_content()
    docs = data.get("documents", [])

    if request.method == "POST":
        action = request.form.get("action")
        if action == "delete":
            idx = request.form.get("index", type=int)
            if idx is not None and 0 <= idx < len(docs):
                doc = docs.pop(idx)
                data["documents"] = docs
                save_content(data)
                # optionally remove file
                path = os.path.join(DOCS_UPLOAD_FOLDER, doc.get("filename", ""))
                if os.path.isfile(path):
                    try:
                        os.remove(path)
                    except OSError:
                        pass
        elif action == "add":
            title = request.form.get("title", "").strip()
            file = request.files.get("file")
            if title and file and file.filename and allowed_file(file.filename):
                os.makedirs(DOCS_UPLOAD_FOLDER, exist_ok=True)
                filename = secure_filename(file.filename)
                base, ext = os.path.splitext(filename)
                counter = 0
                while os.path.isfile(os.path.join(DOCS_UPLOAD_FOLDER, filename)):
                    counter += 1
                    filename = f"{base}_{counter}{ext}"
                file.save(os.path.join(DOCS_UPLOAD_FOLDER, filename))
                docs.append({"title": title, "filename": filename})
                data["documents"] = docs
                save_content(data)
        return redirect(url_for("admin_documents"))

    return render_template("admin/documents_edit.html", documents=docs)


# --- Admin: Программы ---
@app.route("/admin/programs", methods=["GET", "POST"])
@admin_required
def admin_programs():
    if request.method == "POST":
        data = load_content()
        programs = []
        for i in range(20):
            title = request.form.get(f"title_{i}", "").strip()
            if not title:
                continue
            desc = request.form.get(f"description_{i}", "")
            opts = request.form.get(f"options_{i}", "")
            image = request.form.get(f"image_{i}", "").strip() or f"p{i + 1}.png"
            programs.append({
                "title": title.replace("\n", "<br>"),
                "description": desc,
                "options": [x.strip() for x in opts.split("\n") if x.strip()],
                "image": image,
            })
        data["programs"] = programs
        save_content(data)
        return redirect(url_for("admin_dashboard"))
    data = load_content()
    programs = data.get("programs", [])
    # До 20 слотов: заполненные + пустые
    slots = [(p if i < len(programs) else None) for i, p in enumerate(programs + [None] * 20)]
    slots = slots[:20]
    return render_template("admin/programs_edit.html", program_slots=slots)


# --- Admin: Реквизиты ---
@app.route("/admin/requisites", methods=["GET", "POST"])
@admin_required
def admin_requisites():
    if request.method == "POST":
        data = load_content()
        req = {}
        for key in ["Наименование", "ИНН", "КПП", "ОГРН", "Расчётный счёт", "Банк", "БИК", "Корсчёт"]:
            val = request.form.get(f"req_{key}", "").strip()
            if key in request.form or val:
                req[key] = val
        data["requisites"] = req
        save_content(data)
        return redirect(url_for("admin_dashboard"))
    data = load_content()
    return render_template("admin/requisites_edit.html", requisites=data.get("requisites", {}))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=6200)
