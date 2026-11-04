from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin, CreateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from django.contrib.auth import get_user_model
from django.db import transaction

from trashport.users.models import User, CollectorProfile
from trashport.core.waste_management.models import Hub
from .serializers import (
    CollectorProfileSerializer,
    HubSerializer,
    CollectorRegistrationSerializer,
    CollectorUpdateSerializer,
    UserCollectorSerializer,
)

User = get_user_model()


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    """ViewSet for current user profile."""
    serializer_class = UserCollectorSerializer
    queryset = User.objects.all()
    lookup_field = "pk"

    def get_queryset(self, *args, **kwargs):
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(id=self.request.user.id)

    @action(detail=False)
    def me(self, request):
        serializer = UserCollectorSerializer(request.user, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=serializer.data)


class HubViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """ViewSet for managing collection hubs."""
    serializer_class = HubSerializer
    queryset = Hub.objects.filter(is_active=True).select_related("city")

    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.query_params.get("city_id")
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset


class CollectorViewSet(ModelViewSet):
    """ViewSet for managing collectors registered in hubs."""
    serializer_class = CollectorProfileSerializer
    queryset = CollectorProfile.objects.select_related("user", "hub", "hub__city").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        hub_id = self.request.query_params.get("hub_id")
        city_id = self.request.query_params.get("city_id")
        is_verified = self.request.query_params.get("is_verified")

        if hub_id:
            queryset = queryset.filter(hub_id=hub_id)
        if city_id:
            queryset = queryset.filter(hub__city_id=city_id)
        if is_verified is not None:
            is_verified_bool = is_verified.lower() == "true"
            queryset = queryset.filter(user__is_verified=is_verified_bool)

        return queryset

    @action(detail=False, methods=["get"])
    def by_hub(self, request):
        """Get collectors grouped by hub."""
        hubs = Hub.objects.filter(is_active=True).prefetch_related(
            "collectors__user"
        ).select_related("city")

        hub_id = request.query_params.get("hub_id")
        if hub_id:
            hubs = hubs.filter(id=hub_id)

        data = []
        for hub in hubs:
            collectors = hub.collectors.select_related("user").all()
            collector_data = CollectorProfileSerializer(collectors, many=True).data
            data.append({
                "hub": HubSerializer(hub).data,
                "collectors": collector_data,
                "total_collectors": len(collector_data),
            })

        return Response(data)

    @action(detail=False, methods=["post"])
    def register(self, request):
        """Register a new collector with vehicle details."""
        serializer = CollectorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                email=data["email"],
                name=data["name"],
                phone_number=data["phone_number"],
                password=data["password"],
                role=User.Roles.COLLECTOR,
                verification_status=User.VerificationStatus.PENDING,
            )

            # Get hub
            hub = Hub.objects.get(id=data["hub_id"])

            # Create collector profile with vehicle details
            collector_profile = CollectorProfile.objects.create(
                user=user,
                vehicle_number=data.get("vehicle_number", ""),
                vehicle_type=data.get("vehicle_type", ""),
                vehicle_capacity_kg=data.get("vehicle_capacity_kg"),
                vehicle_capacity_pickups=data.get("vehicle_capacity_pickups", 5),
                license_number=data.get("license_number", ""),
                hub=hub,
            )

        return Response(
            CollectorProfileSerializer(collector_profile).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["patch"])
    def update_vehicle(self, request, pk=None):
        """Update collector's vehicle details."""
        collector = self.get_object()
        serializer = CollectorUpdateSerializer(collector, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CollectorProfileSerializer(collector).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a collector (admin action)."""
        collector = self.get_object()
        collector.user.verification_status = User.VerificationStatus.APPROVED
        collector.user.save(update_fields=["verification_status"])
        return Response(CollectorProfileSerializer(collector).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject a collector (admin action)."""
        collector = self.get_object()
        collector.user.verification_status = User.VerificationStatus.REJECTED
        collector.user.save(update_fields=["verification_status"])
        return Response(CollectorProfileSerializer(collector).data)


class UserCollectorViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """ViewSet for user's collector profile (for mobile app)."""
    serializer_class = UserCollectorSerializer
    queryset = User.objects.filter(role=User.Roles.COLLECTOR).select_related(
        "collector_profile", "collector_profile__hub", "collector_profile__hub__city"
    )
    lookup_field = "pk"

    def get_queryset(self):
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(id=self.request.user.id)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        """Get or update current collector's profile."""
        if request.method == "GET":
            serializer = UserCollectorSerializer(request.user, context={"request": request})
            return Response(serializer.data)
        else:
            # Update collector profile
            collector_profile = request.user.collector_profile
            serializer = CollectorUpdateSerializer(collector_profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(UserCollectorSerializer(request.user, context={"request": request}).data)
