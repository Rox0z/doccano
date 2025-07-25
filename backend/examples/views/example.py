from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from examples.filters import ExampleFilter
from examples.models import Example
from examples.serializers import ExampleSerializer
from projects.models import Member, Project
from projects.permissions import IsProjectAdmin, IsProjectStaffAndReadOnly


class ExampleList(generics.ListCreateAPIView):
    serializer_class = ExampleSerializer
    permission_classes = [IsAuthenticated & (IsProjectAdmin | IsProjectStaffAndReadOnly)]
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    ordering_fields = ("created_at", "updated_at", "score")
    search_fields = ("text", "filename")
    model = Example
    filterset_class = ExampleFilter

    @property
    def project(self):
        return get_object_or_404(Project, pk=self.kwargs["project_id"])

    def get_queryset(self):
        member = get_object_or_404(Member, project=self.project, user=self.request.user)
        if member.is_admin():
            queryset = self.model.objects.filter(project=self.project)
        else:
            queryset = self.model.objects.filter(project=self.project, assignments__assignee=self.request.user)
            if self.project.random_order:
                queryset = queryset.order_by("assignments__id")

        # Se include_annotation for solicitado, fazer prefetch das anotações e assignments
        if self.request.query_params.get("include_annotation"):
            queryset = queryset.prefetch_related(
                'categories__label',
                'categories__user',
                'spans__label',
                'spans__user',
                'relations__type',
                'relations__user',
                'texts__user',
                'assignments__assignee'
            )

        # Filtrar apenas exemplos com discrepâncias se o projeto estiver em versão > 1
        if self.project.current_version > 1:
            # Usa o snapshot dos exemplos da versão atual (fixo durante toda a versão)
            version_example_ids = self.project.get_version_examples()
            queryset = queryset.filter(id__in=version_example_ids)

        return queryset

    def perform_create(self, serializer):
        serializer.save(project=self.project)

    def delete(self, request, *args, **kwargs):
        queryset = self.project.examples
        delete_ids = request.data["ids"]
        if delete_ids:
            queryset.filter(pk__in=delete_ids).delete()
        else:
            queryset.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExampleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Example.objects.all()
    serializer_class = ExampleSerializer
    lookup_url_kwarg = "example_id"
    permission_classes = [IsAuthenticated & (IsProjectAdmin | IsProjectStaffAndReadOnly)]
