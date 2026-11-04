from rest_framework import serializers

from trashport.users.models import User, CollectorProfile, CitizenProfile
from trashport.core.waste_management.models import Hub


class CollectorProfileSerializer(serializers.ModelSerializer):
    """Serializer for collector profile with vehicle details."""
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_phone = serializers.CharField(source="user.phone_number", read_only=True)
    hub_name = serializers.CharField(source="hub.name", read_only=True)
    hub_city = serializers.CharField(source="hub.city.name", read_only=True)
    is_verified = serializers.BooleanField(source="user.is_verified", read_only=True)

    class Meta:
        model = CollectorProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "user_phone",
            "wallet_balance",
            "vehicle_number",
            "vehicle_type",
            "vehicle_capacity_kg",
            "vehicle_capacity_pickups",
            "license_number",
            "hub",
            "hub_name",
            "hub_city",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "wallet_balance", "created_at", "updated_at"]


class HubSerializer(serializers.ModelSerializer):
    """Serializer for hub with collector count."""
    city_name = serializers.CharField(source="city.name", read_only=True)
    collectors_count = serializers.IntegerField(source="collectors.count", read_only=True)

    class Meta:
        model = Hub
        fields = [
            "id",
            "name",
            "city",
            "city_name",
            "latitude",
            "longitude",
            "address",
            "is_active",
            "collectors_count",
            "created_at",
            "updated_at",
        ]


class CollectorRegistrationSerializer(serializers.Serializer):
    """Serializer for registering a new collector."""
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)
    # Vehicle details
    vehicle_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vehicle_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vehicle_capacity_kg = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, min_value=0.01
    )
    vehicle_capacity_pickups = serializers.IntegerField(default=5, min_value=1)
    license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    hub_id = serializers.IntegerField()


class CollectorUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating collector profile."""
    vehicle_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vehicle_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vehicle_capacity_kg = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, min_value=0.01
    )
    vehicle_capacity_pickups = serializers.IntegerField(min_value=1, required=False)
    license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    hub = serializers.PrimaryKeyRelatedField(queryset=Hub.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = CollectorProfile
        fields = [
            "vehicle_number",
            "vehicle_type",
            "vehicle_capacity_kg",
            "vehicle_capacity_pickups",
            "license_number",
            "hub",
        ]


class UserCollectorSerializer(serializers.ModelSerializer):
    """Serializer for User with collector profile data."""
    collector_profile = CollectorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "phone_number",
            "role",
            "verification_status",
            "collector_profile",
        ]
