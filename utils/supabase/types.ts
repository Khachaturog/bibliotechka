export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      resources: {
        Row: {
          slug: number // Первичный ключ, бывший row_number
          title: string
          description: string | null
          author: string | null
          status_slug: string
          published: string | null // date в PostgreSQL
          updated_at: string | null // timestamp without time zone в PostgreSQL
          created_at: string | null // timestamp without time zone в PostgreSQL
          group_slug: string
          subgroup_slug: string
          subsubgroup_slug: string | null
          url_1: string | null
          url_title_1: string | null
          url_2: string | null
          url_title_2: string | null
          url_3: string | null
          url_title_3: string | null
          url_4: string | null
          url_title_4: string | null
          url_5: string | null
          url_title_5: string | null
          start_date: string | null // timestamp without time zone в PostgreSQL
          end_date: string | null // timestamp without time zone в PostgreSQL
          comment: string | null
          author_ai: string | null
          title_ai: string | null
          description_ai: string | null
          summary_ai: string | null
          version_id: number | null
        }
        Insert: {
          slug: number // Первичный ключ, бывший row_number
          title: string
          description?: string | null
          author?: string | null
          status_slug: string
          published?: string | null // date в PostgreSQL
          updated_at?: string | null // timestamp without time zone в PostgreSQL
          created_at?: string | null // timestamp without time zone в PostgreSQL
          group_slug: string
          subgroup_slug: string
          subsubgroup_slug?: string | null
          url_1?: string | null
          url_title_1?: string | null
          url_2?: string | null
          url_title_2?: string | null
          url_3?: string | null
          url_title_3?: string | null
          url_4?: string | null
          url_title_4?: string | null
          url_5?: string | null
          url_title_5?: string | null
          start_date?: string | null // timestamp without time zone в PostgreSQL
          end_date?: string | null // timestamp without time zone в PostgreSQL
          comment?: string | null
          author_ai?: string | null
          title_ai?: string | null
          description_ai?: string | null
          summary_ai?: string | null
          version_id?: number | null
        }
        Update: {
          slug?: number // Первичный ключ, бывший row_number
          title?: string
          description?: string | null
          author?: string | null
          status_slug?: string
          published?: string | null // date в PostgreSQL
          updated_at?: string | null // timestamp without time zone в PostgreSQL
          created_at?: string | null // timestamp without time zone в PostgreSQL
          group_slug?: string
          subgroup_slug?: string
          subsubgroup_slug?: string | null
          url_1?: string | null
          url_title_1?: string | null
          url_2?: string | null
          url_title_2?: string | null
          url_3?: string | null
          url_title_3?: string | null
          url_4?: string | null
          url_title_4?: string | null
          url_5?: string | null
          url_title_5?: string | null
          start_date?: string | null // timestamp without time zone в PostgreSQL
          end_date?: string | null // timestamp without time zone в PostgreSQL
          comment?: string | null
          author_ai?: string | null
          title_ai?: string | null
          description_ai?: string | null
          summary_ai?: string | null
          version_id?: number | null
        }
      }
      versions: {
        Row: {
          slug: number // Переименовано из id
          version: string
          display_name: string | null
          description: string | null
          release_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          slug?: number // Переименовано из id
          version: string
          display_name?: string | null
          description?: string | null
          release_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          slug?: number // Переименовано из id
          version?: string
          display_name?: string | null
          description?: string | null
          release_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      groups: {
        Row: {
          slug: string
          display_name: string | null
          description: string | null
          updated_at: string | null
          cover_url: string | null
        }
        Insert: {
          slug: string
          display_name?: string | null
          description?: string | null
          updated_at?: string | null
          cover_url?: string | null
        }
        Update: {
          slug?: string
          display_name?: string | null
          description?: string | null
          updated_at?: string | null
          cover_url?: string | null
        }
      }
      subgroups: {
        Row: {
          slug: string
          display_name: string | null
          description: string | null
          updated_at: string | null
        }
        Insert: {
          slug: string
          display_name?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          slug?: string
          display_name?: string | null
          description?: string | null
          updated_at?: string | null
        }
      }
      subsubgroups: {
        Row: {
          slug: string
          display_name: string
          updated_at: string | null
        }
        Insert: {
          slug: string
          display_name: string
          updated_at?: string | null
        }
        Update: {
          slug?: string
          display_name?: string
          updated_at?: string | null
        }
      }
      statuses: {
        Row: {
          slug: string
          name: string
          description: string | null
          updated_at: string | null
        }
        Insert: {
          slug: string
          name: string
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          slug?: string
          name?: string
          description?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      // Если у вас есть представления, добавьте их здесь
    }
  }
}

export type Resource = Database["public"]["Tables"]["resources"]["Row"]
export type Group = Database["public"]["Tables"]["groups"]["Row"]
export type Subgroup = Database["public"]["Tables"]["subgroups"]["Row"]
export type Subsubgroup = Database["public"]["Tables"]["subsubgroups"]["Row"]
export type Status = Database["public"]["Tables"]["statuses"]["Row"]
export type Version = Database["public"]["Tables"]["versions"]["Row"]

// Константы для статусов
export const STATUSES = {
  PUBLISHED: "published",
  AVAILABLE: "available",
  COMING_SOON: "coming-soon",
  ARCHIVED: "archived",
  TRASH: "trash",
} as const

export type StatusSlug = (typeof STATUSES)[keyof typeof STATUSES]
