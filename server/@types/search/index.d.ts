export type SearchRequest = {
  message: string
}

export type SearchResponse = {
  message: string
  components: Component[]
}

export type Component = {
  title: string
  url: string
  description: string
  parent: string
  accessability: string
  created_at: string
  updated_at: string
  has_research: boolean
  favourites: number
}
