import { APIOptionsGroupRepository } from '~/repositories/perspective/question/apiOptionsGroupRepository'
import { OptionsGroupDTO } from '~/services/application/perspective/question/questionData'

export class OptionsGroupApplicationService {
  constructor(private readonly repository: APIOptionsGroupRepository) {}

  public async create(projectId: string, item: OptionsGroupDTO): Promise<OptionsGroupDTO> {
    return await this.repository.create(projectId, item)
  }

  public async findByName(projectId: string, name: string): Promise<OptionsGroupDTO | null> {
    return await this.repository.findByName(projectId, name)
  }
} 