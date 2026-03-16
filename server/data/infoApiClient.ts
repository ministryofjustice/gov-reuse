import { DesignSystemInfo, DesignManualInfo, ProductInfo, ServicePatternInfo, StandardInfo, StyleGuideInfo } from '../@types/records'
import contentData from './contentData'
import { ContentFilter } from '../@types/filters'

export default class InfoApiClient {

  applyFilters = function(items: Array<any>, filters: ContentFilter): Array<any> {
    return items.filter(item => {
      // It's not clean code, but it does the job for our prototype and there's test coverage.
      // We can always refactor later if we decide to add more filters.
      return (
        (item['contentType'] === filters['contentType'] || "All types" === filters['contentType'] || filters['contentType'] === "")
        && (item['department'] === filters['department'] || filters['department'] === "All departments" || filters['department'] === "")
        && (item['profession'].includes(filters['profession']) || filters['profession'] === "All professions" || filters['profession'] === "")
      )
    })
  }

  getDesignSystems = (filters: ContentFilter): Array<DesignSystemInfo> => {
    return this.applyFilters(contentData.sections['design-systems'].items, filters) as Array<DesignSystemInfo>
  }

  getManuals = (filters: ContentFilter): Array<DesignManualInfo> => {
    return this.applyFilters(contentData.sections.manuals.items, filters) as Array<DesignManualInfo>
  }

  getProducts = (filters: ContentFilter): Array<ProductInfo> => {
    return this.applyFilters(contentData.sections.products.items, filters) as Array<ProductInfo>
  }

  getServicePatterns = (filters: ContentFilter): Array<ServicePatternInfo> => {
    return this.applyFilters(contentData.sections['service-patterns'].items, filters) as Array<ServicePatternInfo>
  }

  getStandards = (filters: ContentFilter): Array<StandardInfo> => {
    return this.applyFilters(contentData.sections.standards.items, filters) as Array<StandardInfo>
  }

  getStyleGuides = (filters: ContentFilter): Array<StyleGuideInfo> => {
    return this.applyFilters(contentData.sections['content-style-guides'].items, filters) as Array<StyleGuideInfo>
  }

  getDepartmentFilters = (): Array<string> => {
    return contentData.filterOptions.departments
  }

  getContentTypesFilters = (): Array<string> => {
    return contentData.filterOptions.contentTypes
  }

  getProfessionsFilters= (): Array<string> => {
    return contentData.filterOptions.professions
  }
}
