# Collector registry and Android deployment

## New administration workflow

1. Sign in with an administrator account.
2. Open **Hub & Terminal Management**. Each hub shows its registered collectors and links to its filtered directory and collector registration form.
3. Register a collector: email, name, password/confirmation, optional phone/license, hub, vehicle registration/type, rated payload in **kg**, and maximum **pickup count per trip**.
4. The collector account, hub profile and assigned vehicle are saved in one database transaction. Registration provisions a verified collector, matching the existing administrator onboarding policy.
5. Use **User Management** to search/filter by hub (including unassigned collectors), review verification, suspend/reactivate accounts or edit collector registration and vehicle details.
6. When editing, leave both password fields empty to preserve the password. Changing a password requires confirmation.

Payload capacity (`Vehicle.capacity_kg`) is stored independently of existing route pickup-count capacity (`Vehicle.max_capacity`). This change records rated payload; it does not introduce weight-based dispatch or overloaded-route enforcement. Existing vehicles retain an empty payload until an administrator supplies it. Existing multi-vehicle assignments are preserved; the collector edit form updates the profile-matching vehicle, falling back to the first assigned vehicle. Manage additional vehicles in Fleet Management.

## Deployment

These are local project changes, not an update already deployed to https://trashport.shop/.

Back up the production database, deploy the reviewed source using the existing deployment pipeline, then run inside the Django service:

```sh
python manage.py migrate
python manage.py collectstatic --noinput
```

The new migration is `waste_management.0016_vehicle_capacity_kg_vehicle_vehicle_type`. Do not use test settings in production. No production data was changed by development tests.

## Verification

Run with the project's existing Python environment:

```sh
.venv/Scripts/python.exe -m pytest -q
.venv/Scripts/python.exe manage.py makemigrations --check --dry-run --settings=config.settings.test
```

See `mobile/README.md` for Android build/install instructions and limitations. The Android client opens the hosted website, so new registry features become available in it only after the server changes above are deployed.
