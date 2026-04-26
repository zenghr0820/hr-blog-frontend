export interface LinkInfo {
  id: number;
  name: string;
  url: string;
  logo: string;
  description: string;
  status: string;
  siteshot: string;
  email: string;
  type: string;
}

export interface FCircleMoment {
  id: number;
  link_id: number;
  post_title: string;
  post_url: string;
  post_summary: string;
  published_at: string;
  fetched_at: string;
  created_at: string;
  updated_at: string;
  link: LinkInfo;
  fishingPrefix?: string;
}

export interface FCircleMomentListResponse {
  list: FCircleMoment[];
  total: number;
  page: number;
  page_size: number;
}

export interface GetMomentsParams {
  page?: number;
  page_size?: number;
  link_id?: number;
}

export interface GetMomentsByLinkIDParams {
  page?: number;
  page_size?: number;
}

export interface FCircleStatistics {
  total_links: number;
  active_links: number;
  total_articles: number;
  last_updated_at: string;
}