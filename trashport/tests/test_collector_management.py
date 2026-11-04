from decimal import Decimal

import pytest
from django.urls import reverse

from trashport.core.waste_management.models import City
from trashport.core.waste_management.models import Hub
from trashport.core.waste_management.models import Vehicle
from trashport.users.models import User


@pytest.fixture
def registry(db, client):
    admin = User.objects.create_user(email="registry-admin@example.com", role=User.Roles.ADMIN)
    client.force_login(admin)
    city = City.objects.create(name="Registry City", state="Kerala")
    hub = Hub.objects.create(name="Registry Hub", city=city, latitude=9, longitude=76, address="Main Road")
    return client, hub


def collector_data(hub):
    return dict(email="registered@example.com", name="Registered Collector", password="Test-Strong-456!",
                confirm_password="Test-Strong-456!", phone_number="9876543210", license_number="KL123456",
                hub=hub.pk, vehicle_number="KL-07-AB-1234", vehicle_type="Mini truck",
                capacity_kg="750.50", max_capacity="5")


def test_admin_registers_collector_hub_and_vehicle_together(registry):
    client, hub = registry
    response = client.post(reverse("waste_management:collector_create"), collector_data(hub))
    assert response.status_code == 302
    collector = User.objects.get(email="registered@example.com")
    assert collector.collector_profile.hub == hub
    assert collector.phone_number == "9876543210"
    assert collector.collector_profile.license_number == "KL123456"
    assert collector.check_password("Test-Strong-456!")
    vehicle = Vehicle.objects.get(driver=collector)
    assert vehicle.hub == hub
    assert vehicle.capacity_kg == Decimal("750.50")
    assert vehicle.vehicle_type == "Mini truck"
    assert vehicle.max_capacity == 5


def test_directory_filters_by_registered_hub(registry):
    client, hub = registry
    client.post(reverse("waste_management:collector_create"), collector_data(hub))
    User.objects.create_user(email="unassigned@example.com", role=User.Roles.COLLECTOR)
    response = client.get(reverse("waste_management:user_list"), {"role": "COLLECTOR", "hub": hub.pk})
    assert [u.email for u in response.context["users_list"]] == ["registered@example.com"]
    response = client.get(reverse("waste_management:user_list"), {"role": "COLLECTOR", "hub": "unassigned"})
    assert [u.email for u in response.context["users_list"]] == ["unassigned@example.com"]


def test_admin_edits_collector_vehicle_without_resetting_password(registry):
    client, hub = registry
    client.post(reverse("waste_management:collector_create"), collector_data(hub))
    collector = User.objects.get(email="registered@example.com")
    vehicle = Vehicle.objects.get(driver=collector)
    data = collector_data(hub)
    data.pop("password")
    data.pop("confirm_password")
    data["capacity_kg"] = "950.00"
    data["name"] = "Updated Collector"
    response = client.post(reverse("waste_management:collector_update", args=[collector.pk]), data)
    assert response.status_code == 302
    collector.refresh_from_db()
    vehicle.refresh_from_db()
    assert collector.name == "Updated Collector"
    assert collector.check_password("Test-Strong-456!")
    assert vehicle.capacity_kg == Decimal("950.00")
    assert Vehicle.objects.filter(driver=collector).count() == 1


def test_vehicle_form_exposes_payload_details(registry):
    client, hub = registry
    response = client.get(reverse("waste_management:vehicle_create"))
    assert "capacity_kg" in response.context["form"].fields
    assert "vehicle_type" in response.context["form"].fields


def test_edit_password_requires_confirmation(registry):
    client, hub = registry
    client.post(reverse("waste_management:collector_create"), collector_data(hub))
    collector = User.objects.get(email="registered@example.com")
    data = collector_data(hub)
    data["confirm_password"] = ""
    response = client.post(reverse("waste_management:collector_update", args=[collector.pk]), data)
    assert response.status_code == 200
    assert "confirm_password" in response.context["form"].errors


@pytest.mark.parametrize("field,value", [("hub", ""), ("capacity_kg", "0"), ("capacity_kg", "-1"),
                                         ("capacity_kg", "NaN"), ("max_capacity", "0"),
                                         ("vehicle_number", ""), ("vehicle_type", "")])
def test_invalid_registration_creates_no_partial_account(registry, field, value):
    client, hub = registry
    data = collector_data(hub)
    data[field] = value
    response = client.post(reverse("waste_management:collector_create"), data)
    assert response.status_code == 200
    assert field in response.context["form"].errors
    assert not User.objects.filter(email=data["email"]).exists()
    assert not Vehicle.objects.filter(vehicle_number=data["vehicle_number"]).exists()


@pytest.mark.parametrize("role", [User.Roles.CITIZEN, User.Roles.COLLECTOR])
def test_non_admin_cannot_manage_collectors(registry, role):
    client, hub = registry
    user = User.objects.create_user(email="blocked@example.com", role=role)
    client.force_login(user)
    assert client.post(reverse("waste_management:collector_create"), collector_data(hub)).status_code == 403
    assert client.get(reverse("waste_management:user_list"), {"hub": hub.pk}).status_code == 403
    assert client.post(reverse("waste_management:collector_update", args=[user.pk]), collector_data(hub)).status_code == 403


def test_duplicate_vehicle_does_not_create_collector(registry):
    client, hub = registry
    client.post(reverse("waste_management:collector_create"), collector_data(hub))
    data = collector_data(hub)
    data["email"] = "duplicate@example.com"
    data["vehicle_number"] = data["vehicle_number"].lower()
    response = client.post(reverse("waste_management:collector_create"), data)
    assert response.status_code == 200
    assert "vehicle_number" in response.context["form"].errors
    assert not User.objects.filter(email=data["email"]).exists()


def test_hub_counts_and_registration_prefill(registry):
    client, hub = registry
    client.post(reverse("waste_management:collector_create"), collector_data(hub))
    response = client.get(reverse("waste_management:hub_list"))
    assert response.context["hubs"].get(pk=hub.pk).collector_count == 1
    response = client.get(reverse("waste_management:collector_create"), {"hub": hub.pk})
    assert str(response.context["form"].initial["hub"]) == str(hub.pk)



