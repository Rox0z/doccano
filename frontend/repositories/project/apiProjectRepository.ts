import { Page } from '@/domain/models/page'
import { Project } from '@/domain/models/project/project'
import ApiService from '@/services/api.service'
import { TagItem } from '~/domain/models/tag/tag'

const sortableFieldList = ['name', 'projectType', 'createdAt', 'author'] as const
type SortableFields = (typeof sortableFieldList)[number]

export class SearchQuery {
  readonly limit: number = 10
  readonly offset: number = 0
  readonly q: string = ''
  readonly sortBy: SortableFields = 'createdAt'
  readonly sortDesc: boolean = false

  constructor(_limit: string, _offset: string, _q?: string, _sortBy?: string, _sortDesc?: string) {
    this.limit = /^\d+$/.test(_limit) ? parseInt(_limit) : 10
    this.offset = /^\d+$/.test(_offset) ? parseInt(_offset) : 0
    this.q = _q || ''
    this.sortBy = (
      _sortBy && sortableFieldList.includes(_sortBy as SortableFields) ? _sortBy : 'createdAt'
    ) as SortableFields
    this.sortDesc = _sortDesc === 'true'
  }
}

// comentário

function toModel(item: { [key: string]: any }): Project {
  return new Project(
    item.id,
    item.name,
    item.description,
    item.guideline,
    item.project_type,
    item.label_discrepancy_threshold || 0,
    item.random_order,
    item.collaborative_annotation,
    item.single_class_classification,
    item.allow_overlapping,
    item.grapheme_mode,
    item.use_relation,
    item.tags.map((tag: { [key: string]: any }) => new TagItem(tag.id, tag.text, tag.project)),
    item.allow_member_to_create_label_type,
    item.users,
    item.created_at,
    item.updated_at,
    item.author,
    item.is_text_project,
    item.status || 'open',
    item.current_version || 1,
    item.is_open !== undefined ? item.is_open : true,
    item.is_closed !== undefined ? item.is_closed : false
  )
}

function toPayload(item: Project): { [key: string]: any } {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    guideline: item.guideline,
    project_type: item.projectType,
    label_discrepancy_threshold: item.labelDiscrepancyThreshold,
    random_order: item.enableRandomOrder,
    collaborative_annotation: item.enableSharingMode,
    single_class_classification: item.exclusiveCategories,
    allow_overlapping: item.allowOverlappingSpans,
    grapheme_mode: item.enableGraphemeMode,
    use_relation: item.useRelation,
    tags: item.tags,
    allow_member_to_create_label_type: item.allowMemberToCreateLabelType,
    resourcetype: item.resourceType
  }
}

export class APIProjectRepository {
  constructor(private readonly request = ApiService) {}

  async list(query: SearchQuery): Promise<Page<Project>> {
    const fieldMapper = {
      name: 'name',
      createdAt: 'created_at',
      projectType: 'project_type',
      author: 'created_by'
    }
    const sortBy = fieldMapper[query.sortBy]
    const ordering = query.sortDesc ? `-${sortBy}` : `${sortBy}`
    const url = `/projects?limit=${query.limit}&offset=${query.offset}&q=${query.q}&ordering=${ordering}`
    const response = await this.request.get(url)
    return new Page(
      response.data.count,
      response.data.next,
      response.data.previous,
      response.data.results.map((project: { [key: string]: any }) => toModel(project))
    )
  }

  async findById(id: string): Promise<Project> {
    const url = `/projects/${id}`
    const response = await this.request.get(url)
    return toModel(response.data)
  }

  async create(item: Project): Promise<Project> {
    const url = `/projects`
    const payload = toPayload(item)
    const response = await this.request.post(url, payload)
    return toModel(response.data)
  }

  async update(item: Project): Promise<void> {
    const url = `/projects/${item.id}`
    const payload = toPayload(item)
    await this.request.patch(url, payload)
  }

  async bulkDelete(projectIds: number[]): Promise<void> {
    const url = `/projects`
    await this.request.delete(url, { ids: projectIds })
  }

  async clone(project: Project): Promise<Project> {
    const url = `/projects/${project.id}/clone`
    const response = await this.request.post(url)
    return toModel(response.data)
  }

  async closeProject(projectId: string): Promise<any> {
    const url = `/projects/${projectId}/close`
    const response = await this.request.post(url)
    return response.data
  }

  async reopenProject(projectId: string): Promise<any> {
    const url = `/projects/${projectId}/reopen`
    const response = await this.request.post(url)
    return response.data
  }

  async getVersionStatus(projectId: string): Promise<any> {
    const url = `/projects/${projectId}/version-status`
    const response = await this.request.get(url)
    return response.data
  }

  async getVersions(projectId: string): Promise<any> {
    const url = `/projects/${projectId}/versions`
    const response = await this.request.get(url)
    return response.data
  }

  async getVersionsReport(projectId: string, filters?: any): Promise<any> {
    const url = `/projects/${projectId}/versions-report`
    const params = new URLSearchParams()
    
    if (filters?.version) params.append('version', filters.version)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.user) params.append('user', filters.user)
    
    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url
    const response = await this.request.get(fullUrl)
    return response.data
  }

  exportVersionsReport(projectId: string, filters: any = {}) {
    // Construir parâmetros de query
    const params = new URLSearchParams()
    
    if (filters.version) {
      params.append('version', filters.version)
    }
    if (filters.status) {
      params.append('status', filters.status)
    }
    if (filters.user) {
      params.append('user', filters.user)
    }
    
    const queryString = params.toString()
    const url = `/projects/${projectId}/versions-report/export${queryString ? `?${queryString}` : ''}`
    
    return this.request.get(url, {
      responseType: 'blob',
    }).then((response) => {
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `versions-report-${projectId}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    })
  }

  exportVersionsReportPdf(projectId: string, filters: any = {}) {
    // Construir parâmetros de query
    const params = new URLSearchParams()
    
    if (filters.version) {
      params.append('version', filters.version)
    }
    if (filters.status) {
      params.append('status', filters.status)
    }
    if (filters.user) {
      params.append('user', filters.user)
    }
    
    const queryString = params.toString()
    const url = `/projects/${projectId}/versions-report/export-pdf${queryString ? `?${queryString}` : ''}`
    
    return this.request.get(url, {
      responseType: 'blob',
    }).then((response) => {
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `versions-report-${projectId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    })
  }
}
