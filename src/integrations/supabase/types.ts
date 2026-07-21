export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      eventos: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha: string | null
          id: string
          nombre: string
          portada_url: string | null
          precio_individual: number
          precio_pack3: number
          precio_paquete_completo: number
          publicado: boolean
          ubicacion: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha?: string | null
          id?: string
          nombre: string
          portada_url?: string | null
          precio_individual?: number
          precio_pack3?: number
          precio_paquete_completo?: number
          publicado?: boolean
          ubicacion?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string | null
          id?: string
          nombre?: string
          portada_url?: string | null
          precio_individual?: number
          precio_pack3?: number
          precio_paquete_completo?: number
          publicado?: boolean
          ubicacion?: string | null
        }
        Relationships: []
      }
      fotografias: {
        Row: {
          atleta: string | null
          atleta_tag: string | null
          categoria: string | null
          created_at: string
          dorsal: string | null
          equipo: string | null
          evento_id: string
          foto_privada_path: string
          foto_publica_url: string
          id: string
          tipo_foto: Database["public"]["Enums"]["tipo_foto"]
          video_privada_path: string | null
        }
        Insert: {
          atleta?: string | null
          atleta_tag?: string | null
          categoria?: string | null
          created_at?: string
          dorsal?: string | null
          equipo?: string | null
          evento_id: string
          foto_privada_path: string
          foto_publica_url: string
          id?: string
          tipo_foto?: Database["public"]["Enums"]["tipo_foto"]
          video_privada_path?: string | null
        }
        Update: {
          atleta?: string | null
          atleta_tag?: string | null
          categoria?: string | null
          created_at?: string
          dorsal?: string | null
          equipo?: string | null
          evento_id?: string
          foto_privada_path?: string
          foto_publica_url?: string
          id?: string
          tipo_foto?: Database["public"]["Enums"]["tipo_foto"]
          video_privada_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fotografias_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          archivos_enviados: boolean
          created_at: string
          email_comprador: string
          estado: Database["public"]["Enums"]["estado_pago"]
          fecha_envio: string | null
          id: string
          items: Json
          monto_total: number
          nombre_comprador: string | null
          proveedor_pago: string | null
          referencia_pago: string | null
          updated_at: string
        }
        Insert: {
          archivos_enviados?: boolean
          created_at?: string
          email_comprador: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          fecha_envio?: string | null
          id?: string
          items?: Json
          monto_total?: number
          nombre_comprador?: string | null
          proveedor_pago?: string | null
          referencia_pago?: string | null
          updated_at?: string
        }
        Update: {
          archivos_enviados?: boolean
          created_at?: string
          email_comprador?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          fecha_envio?: string | null
          id?: string
          items?: Json
          monto_total?: number
          nombre_comprador?: string | null
          proveedor_pago?: string | null
          referencia_pago?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      fotografias_publicas: {
        Row: {
          atleta: string | null
          categoria: string | null
          created_at: string | null
          dorsal: string | null
          equipo: string | null
          evento_id: string | null
          foto_publica_url: string | null
          id: string | null
          tipo_foto: Database["public"]["Enums"]["tipo_foto"] | null
        }
        Insert: {
          atleta?: string | null
          categoria?: string | null
          created_at?: string | null
          dorsal?: string | null
          equipo?: string | null
          evento_id?: string | null
          foto_publica_url?: string | null
          id?: string | null
          tipo_foto?: Database["public"]["Enums"]["tipo_foto"] | null
        }
        Update: {
          atleta?: string | null
          categoria?: string | null
          created_at?: string | null
          dorsal?: string | null
          equipo?: string | null
          evento_id?: string | null
          foto_publica_url?: string | null
          id?: string | null
          tipo_foto?: Database["public"]["Enums"]["tipo_foto"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fotografias_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_categorias_por_equipo: {
        Args: { p_equipo: string; p_evento_id: string }
        Returns: {
          categoria: string
        }[]
      }
      get_conteo_por_tipo: {
        Args: { p_categoria: string; p_equipo: string; p_evento_id: string }
        Returns: {
          tipo_foto: Database["public"]["Enums"]["tipo_foto"]
          total: number
        }[]
      }
      get_equipos_por_evento: {
        Args: { p_evento_id: string }
        Returns: {
          equipo: string
        }[]
      }
    }
    Enums: {
      estado_pago: "pendiente" | "aprobado" | "rechazado" | "reembolsado"
      tipo_foto: "oficial" | "individual" | "rutina"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_pago: ["pendiente", "aprobado", "rechazado", "reembolsado"],
      tipo_foto: ["oficial", "individual", "rutina"],
    },
  },
} as const
