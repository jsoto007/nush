from .extensions import db


class Example(db.Model):
    __tablename__ = "examples"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
