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
      assinaturas: {
        Row: {
          assinado_em: string
          email: string | null
          formulario_id: string
          id: string
          matricula: string | null
          nome: string
          perfil: string | null
          tipo_assinatura: string
          user_id: string
        }
        Insert: {
          assinado_em?: string
          email?: string | null
          formulario_id: string
          id?: string
          matricula?: string | null
          nome: string
          perfil?: string | null
          tipo_assinatura: string
          user_id: string
        }
        Update: {
          assinado_em?: string
          email?: string | null
          formulario_id?: string
          id?: string
          matricula?: string | null
          nome?: string
          perfil?: string | null
          tipo_assinatura?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclo_etapas: {
        Row: {
          ciclo_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          etapa: Database["public"]["Enums"]["etapa_avaliacao"]
          id: string
          updated_at: string
        }
        Insert: {
          ciclo_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          etapa: Database["public"]["Enums"]["etapa_avaliacao"]
          id?: string
          updated_at?: string
        }
        Update: {
          ciclo_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          etapa?: Database["public"]["Enums"]["etapa_avaliacao"]
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciclo_etapas_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos_avaliacao: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string
          id: string
          nome: string
          numero_avaliacao: number | null
          orgao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by: string
          id?: string
          nome: string
          numero_avaliacao?: number | null
          orgao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string
          id?: string
          nome?: string
          numero_avaliacao?: number | null
          orgao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      formularios: {
        Row: {
          codigo_verificacao: string | null
          created_at: string
          created_by: string
          dados: Json
          dados_revisao: Json | null
          homologacao: Json | null
          homologado_em: string | null
          homologado_por: string | null
          id: string
          numero_avaliacao: number | null
          orgao: string | null
          pontuacao: number | null
          prazo_resposta: string | null
          raep_formulario_id: string | null
          resposta_em: string | null
          resposta_servidor: string | null
          revisado_em: string | null
          servidor_matricula: string | null
          servidor_nome: string
          servidor_user_id: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo_verificacao?: string | null
          created_at?: string
          created_by: string
          dados: Json
          dados_revisao?: Json | null
          homologacao?: Json | null
          homologado_em?: string | null
          homologado_por?: string | null
          id?: string
          numero_avaliacao?: number | null
          orgao?: string | null
          pontuacao?: number | null
          prazo_resposta?: string | null
          raep_formulario_id?: string | null
          resposta_em?: string | null
          resposta_servidor?: string | null
          revisado_em?: string | null
          servidor_matricula?: string | null
          servidor_nome: string
          servidor_user_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          codigo_verificacao?: string | null
          created_at?: string
          created_by?: string
          dados?: Json
          dados_revisao?: Json | null
          homologacao?: Json | null
          homologado_em?: string | null
          homologado_por?: string | null
          id?: string
          numero_avaliacao?: number | null
          orgao?: string | null
          pontuacao?: number | null
          prazo_resposta?: string | null
          raep_formulario_id?: string | null
          resposta_em?: string | null
          resposta_servidor?: string | null
          revisado_em?: string | null
          servidor_matricula?: string | null
          servidor_nome?: string
          servidor_user_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formularios_raep_formulario_id_fkey"
            columns: ["raep_formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          nome_completo: string | null
          orgao: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          matricula?: string | null
          nome_completo?: string | null
          orgao?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome_completo?: string | null
          orgao?: string | null
        }
        Relationships: []
      }
      servidores: {
        Row: {
          ano_admissao: number | null
          cargo: string | null
          created_at: string
          data_inicio_exercicio: string | null
          id: string
          matricula: string
          mes_admissao: string | null
          nome: string
          orgao: string
          subtipo_vinculo: string | null
          vinculo: string | null
        }
        Insert: {
          ano_admissao?: number | null
          cargo?: string | null
          created_at?: string
          data_inicio_exercicio?: string | null
          id?: string
          matricula: string
          mes_admissao?: string | null
          nome: string
          orgao: string
          subtipo_vinculo?: string | null
          vinculo?: string | null
        }
        Update: {
          ano_admissao?: number | null
          cargo?: string | null
          created_at?: string
          data_inicio_exercicio?: string | null
          id?: string
          matricula?: string
          mes_admissao?: string | null
          nome?: string
          orgao?: string
          subtipo_vinculo?: string | null
          vinculo?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expirar_prazos_avaliacao: { Args: never; Returns: undefined }
      listar_orgaos: {
        Args: never
        Returns: {
          orgao: string
        }[]
      }
      prazo_dias_uteis: {
        Args: { _dias: number; _inicio: string }
        Returns: string
      }
      prazo_etapa: {
        Args: {
          _etapa: Database["public"]["Enums"]["etapa_avaliacao"]
          _numero: number
          _orgao: string
        }
        Returns: string
      }
      verificar_documento: { Args: { _codigo: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "gestao_pessoas"
        | "comissao"
        | "avaliador"
        | "chefia_imediata"
        | "chefia_mediata"
        | "par"
        | "servidor"
      etapa_avaliacao:
        | "avaliacao_chefia"
        | "avaliacao_pares"
        | "ciencia_servidor"
        | "pedido_reconsideracao"
        | "resposta_chefia"
        | "ciencia_resposta_chefia"
        | "recurso_comissao_setorial"
        | "resposta_comissao_setorial"
        | "ciencia_resposta_setorial"
        | "recurso_comissao_central"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "gestao_pessoas",
        "comissao",
        "avaliador",
        "chefia_imediata",
        "chefia_mediata",
        "par",
        "servidor",
      ],
      etapa_avaliacao: [
        "avaliacao_chefia",
        "avaliacao_pares",
        "ciencia_servidor",
        "pedido_reconsideracao",
        "resposta_chefia",
        "ciencia_resposta_chefia",
        "recurso_comissao_setorial",
        "resposta_comissao_setorial",
        "ciencia_resposta_setorial",
        "recurso_comissao_central",
      ],
    },
  },
} as const
