from app import create_app
from app.extensions import db
from app.models import Permission, Role, RolePermission


ROLE_DEFINITIONS = {
    "owner": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
        "discount.apply",
        "order.view",
        "order.update_status",
        "payout.view",
    ],
    "manager": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
        "discount.apply",
        "order.view",
        "order.update_status",
        "payout.view",
    ],
    "menu_editor": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
    ],
    "viewer": [
        "order.view",
        "payout.view",
    ],
    "support": [
        "order.view",
        "order.update_status",
    ],
    "admin": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
        "discount.apply",
        "order.view",
        "order.update_status",
        "payout.view",
    ],
}


def seed_rbac() -> None:
    app = create_app()
    with app.app_context():
        permissions = {}
        for perm_name in {p for perms in ROLE_DEFINITIONS.values() for p in perms}:
            permission = Permission.query.filter_by(name=perm_name).first()
            if not permission:
                permission = Permission(name=perm_name)
                db.session.add(permission)
            permissions[perm_name] = permission

        for role_name, perm_names in ROLE_DEFINITIONS.items():
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name)
                db.session.add(role)
                db.session.flush()

            existing = {
                rp.permission_id
                for rp in RolePermission.query.filter_by(role_id=role.id).all()
            }
            for perm_name in perm_names:
                permission = permissions[perm_name]
                if permission.id in existing:
                    continue
                db.session.add(RolePermission(role_id=role.id, permission_id=permission.id))

        db.session.commit()


if __name__ == "__main__":
    seed_rbac()
