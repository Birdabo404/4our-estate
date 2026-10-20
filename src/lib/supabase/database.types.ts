
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "favorites": {
                  Row: {
                    "created_at": string,"property_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"property_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"property_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"inquiries": {
                  Row: {
                    "buyer_id": string | null,"created_at": string,"email": string,"id": string,"message": string,"name": string,"phone": string | null,"preferred_viewing_date": string | null,"property_id": string,"status": Database["public"]['Enums']["inquiry_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "buyer_id"?: string | null,"created_at"?: string,"email": string,"id"?: string,"message": string,"name": string,"phone"?: string | null,"preferred_viewing_date"?: string | null,"property_id": string,"status"?: Database["public"]['Enums']["inquiry_status"]
                  }
                  Update: {
                    "buyer_id"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"message"?: string,"name"?: string,"phone"?: string | null,"preferred_viewing_date"?: string | null,"property_id"?: string,"status"?: Database["public"]['Enums']["inquiry_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "inquiries_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inquiries_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_transition_rules": {
                  Row: {
                    "allowed_roles": (Database["public"]['Enums']["app_role"])[],"from_status": Database["public"]['Enums']["listing_status"],"to_status": Database["public"]['Enums']["listing_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "allowed_roles": (Database["public"]['Enums']["app_role"])[],"from_status": Database["public"]['Enums']["listing_status"],"to_status": Database["public"]['Enums']["listing_status"]
                  }
                  Update: {
                    "allowed_roles"?: (Database["public"]['Enums']["app_role"])[],"from_status"?: Database["public"]['Enums']["listing_status"],"to_status"?: Database["public"]['Enums']["listing_status"]
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "agency": string | null,"avatar_url": string | null,"bio": string | null,"created_at": string,"full_name": string,"id": string,"license_no": string | null,"phone": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agency"?: string | null,"avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"full_name": string,"id": string,"license_no"?: string | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "agency"?: string | null,"avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"license_no"?: string | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"properties": {
                  Row: {
                    "address": string,"agent_id": string,"amenities": (string)[],"bathrooms": number,"bedrooms": number,"city": string,"created_at": string,"description": string,"featured": boolean,"floor_area_sqm": number,"id": string,"latitude": number | null,"listing_type": Database["public"]['Enums']["listing_type"],"longitude": number | null,"lot_area_sqm": number | null,"neighborhood": string,"parking_slots": number,"price_php": number,"property_type": Database["public"]['Enums']["property_type"],"province": string,"published_at": string | null,"search": unknown,"slug": string,"status": Database["public"]['Enums']["listing_status"],"title": string,"updated_at": string,"year_built": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"agent_id": string,"amenities"?: (string)[],"bathrooms": number,"bedrooms": number,"city": string,"created_at"?: string,"description": string,"featured"?: boolean,"floor_area_sqm": number,"id"?: string,"latitude"?: number | null,"listing_type": Database["public"]['Enums']["listing_type"],"longitude"?: number | null,"lot_area_sqm"?: number | null,"neighborhood": string,"parking_slots"?: number,"price_php": number,"property_type": Database["public"]['Enums']["property_type"],"province": string,"published_at"?: string | null,"search"?: never,"slug": string,"status"?: Database["public"]['Enums']["listing_status"],"title": string,"updated_at"?: string,"year_built"?: number | null
                  }
                  Update: {
                    "address"?: string,"agent_id"?: string,"amenities"?: (string)[],"bathrooms"?: number,"bedrooms"?: number,"city"?: string,"created_at"?: string,"description"?: string,"featured"?: boolean,"floor_area_sqm"?: number,"id"?: string,"latitude"?: number | null,"listing_type"?: Database["public"]['Enums']["listing_type"],"longitude"?: number | null,"lot_area_sqm"?: number | null,"neighborhood"?: string,"parking_slots"?: number,"price_php"?: number,"property_type"?: Database["public"]['Enums']["property_type"],"province"?: string,"published_at"?: string | null,"search"?: never,"slug"?: string,"status"?: Database["public"]['Enums']["listing_status"],"title"?: string,"updated_at"?: string,"year_built"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "properties_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"property_images": {
                  Row: {
                    "alt": string,"created_at": string,"id": string,"position": number,"property_id": string,"storage_path": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt": string,"created_at"?: string,"id"?: string,"position": number,"property_id": string,"storage_path"?: string | null,"url": string
                  }
                  Update: {
                    "alt"?: string,"created_at"?: string,"id"?: string,"position"?: number,"property_id"?: string,"storage_path"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "property_images_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_list_users":
{ Args: Record<PropertyKey, never>; Returns: {
              "agency": string,"created_at": string,"email": string,"full_name": string,"id": string,"phone": string,"role": Database["public"]['Enums']["app_role"]
            }[]
                           },
"current_app_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"list_cities":
{ Args: Record<PropertyKey, never>; Returns: {
              "count": number,"name": string,"province": string
            }[]
                           },
"market_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "city_count": number,"listing_count": number,"median_price_php": number
            }[]
                           },
"set_cover_image":
{ Args: { "target_image": string }; Returns: undefined
                           },
"visible_inquiries":
{ Args: Record<PropertyKey, never>; Returns: {
              "agent_id": string,"buyer_id": string,"created_at": string,"email": string,"id": string,"message": string,"name": string,"phone": string,"preferred_viewing_date": string,"property_id": string,"property_slug": string,"property_title": string,"status": Database["public"]['Enums']["inquiry_status"]
            }[]
                           }
          }
          Enums: {
            "app_role": "buyer"|"agent"|"admin","inquiry_status": "new"|"contacted"|"closed","listing_status": "draft"|"pending"|"published"|"sold"|"archived","listing_type": "sale"|"rent","property_type": "house"|"condominium"|"townhouse"|"villa"|"penthouse"|"lot"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["buyer", "agent", "admin"],"inquiry_status": ["new", "contacted", "closed"],"listing_status": ["draft", "pending", "published", "sold", "archived"],"listing_type": ["sale", "rent"],"property_type": ["house", "condominium", "townhouse", "villa", "penthouse", "lot"]
          }
        }
} as const
