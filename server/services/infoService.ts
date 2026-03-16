import InfoApiClient from '../data/infoApiClient'
import {
  DesignManualInfo,
  DesignSystemInfo,
  ProductInfo,
  ServicePatternInfo,
  StandardInfo,
  StyleGuideInfo,
} from '../@types/records'
import { ContentFilter } from '../@types/filters'

export default class InfoService {
  constructor(private readonly dataApiClient: InfoApiClient) {}

  getDesignSystems = async (filters: ContentFilter): Promise<Array<DesignSystemInfo>> => {
    return this.dataApiClient.getDesignSystems(filters)
  }

  getManuals = async (filters: ContentFilter): Promise<Array<DesignManualInfo>> => {
    return this.dataApiClient.getManuals(filters)
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
    return this.dataApiClient.getContentTypesFilters().map(department => ({
      text: department,
      value: department,
    }))
  }

  getProfessionsFilters = async (): Promise<Array<{ text: string; value: string }>> => {
    return this.dataApiClient.getProfessionsFilters().map(job => ({
      text: job,
      value: job,
    }))
  }
}
