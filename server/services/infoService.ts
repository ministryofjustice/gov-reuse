import InfoApiClient from '../data/infoApiClient'
import {
  DesignHistoryInfo,
  DesignManualInfo,
  DesignSystemInfo,
  ProductInfo,
  ServicePatternInfo,
  StandardInfo,
  StyleGuideInfo,
} from '../@types/records'
import { ContentFilter } from '../@types/filters'

type CommunityResourceInfo = {
  title: string
  description: string
  url: string
  department?: string
  contentType: string
  profession: string
  tags?: string[]
}

export default class InfoService {
  constructor(private readonly dataApiClient: InfoApiClient) {}

  getDesignSystems = async (filters: ContentFilter): Promise<Array<DesignSystemInfo>> => {
    return this.dataApiClient.getDesignSystems(filters)
  }

  getManuals = async (filters: ContentFilter): Promise<Array<DesignManualInfo>> => {
    return this.dataApiClient.getManuals(filters)
  }

  getDesignHistories = async (filters: ContentFilter): Promise<Array<DesignHistoryInfo>> => {
    return this.dataApiClient.getDesignHistories(filters)
  }

  getAiResources = async (filters: ContentFilter): Promise<Array<DesignManualInfo>> => {
    return this.dataApiClient.getAiResources(filters)
  }

  getCommunityResources = async (filters: ContentFilter): Promise<Array<CommunityResourceInfo>> => {
    return this.dataApiClient.getCommunityResources(filters)
  }

  getProducts = async (filters: ContentFilter): Promise<Array<ProductInfo>> => {
    return this.dataApiClient.getProducts(filters)
  }

  getServicePatterns = async (filters: ContentFilter): Promise<Array<ServicePatternInfo>> => {
    return this.dataApiClient.getServicePatterns(filters)
  }

  getStandards = async (filters: ContentFilter): Promise<Array<StandardInfo>> => {
    return this.dataApiClient.getStandards(filters)
  }

  getStyleGuides = async (filters: ContentFilter): Promise<Array<StyleGuideInfo>> => {
    return this.dataApiClient.getStyleGuides(filters)
  }

  getDepartmentFilters = async (): Promise<Array<{ text: string; value: string }>> => {
    return this.dataApiClient.getDepartmentFilters().map(department => ({
      text: department,
      value: department,
    }))
  }

  getContentTypesFilters = async (): Promise<Array<{ text: string; value: string }>> => {
    return this.dataApiClient.getContentTypesFilters().map(contentType => ({
      text: contentType,
      value: contentType,
    }))
  }

  getProfessionsFilters = async (): Promise<Array<{ text: string; value: string }>> => {
    return this.dataApiClient.getProfessionsFilters().map(job => ({
      text: job,
      value: job,
    }))
  }
}
