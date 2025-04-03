<template>
  <div class="container">
    <!-- Seleção da pergunta no topo -->
    <v-select
      v-model="selectedQuestion"
      :items="availableQuestions"
      label="Select the question from perspective"
      clearable
      class="mb-4"
    />
    <v-data-table
      :items="processedItems"
      :headers="headers"
      :loading="isLoading"
      :loading-text="$t('generic.loading')"
      :no-data-text="$t('vuetify.noDataAvailable')"
      :footer-props="{
        showFirstLastPage: true,
        'items-per-page-text': $t('vuetify.itemsPerPageText'),
        'page-text': $t('dataset.pageText')
      }"
      item-key="id"
      show-select
      @input="$emit('input', $event)"
    >
      <template #top>
        <v-text-field
          v-model="search"
          :prepend-inner-icon="mdiMagnify"
          :label="$t('generic.search')"
          single-line
          hide-details
          filled
        />
      </template>
      <!-- Oculta o checkbox do header -->
      <template #[`header.data-table-select`]>
        <!-- slot vazio -->
      </template>
      <template #[`item.responses`] = "{ item }">
        <div style="white-space: pre-line;">{{ item.responsesText }}</div>
      </template>
      <template #[`item.members`] = "{ item }">
        <div>{{ item.memberName }}</div>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mdiMagnify } from '@mdi/js'
import type { PropType } from 'vue'
import { PerspectiveDTO } from '~/services/application/perspective/perspectiveData'

export default Vue.extend({
  name: 'PerspectiveList',
  props: {
    isLoading: {
      type: Boolean,
      default: false,
      required: true
    },
    // Os itens continuam vindo normalmente – estes contêm as respostas
    items: {
      type: Array as PropType<PerspectiveDTO[]>,
      default: () => [],
      required: true
    },
    value: {
      type: Array as PropType<PerspectiveDTO[]>,
      default: () => [],
      required: true
    },
    disableEdit: {
      type: Boolean,
      default: false
    },
    members: {
      type: Array as PropType<any[]>,
      default: () => []
    }
  },

  data() {
    return {
      search: '',
      mdiMagnify,
      selectedQuestion: null as string | null,
      // Armazena os nomes carregados para os IDs de 0 a 100
      memberNames: {} as { [key: number]: string }
    }
  },

  computed: {
    headers() {
      return [
        { text: this.$t('Answered by'), value: 'members', sortable: true },
        { text: this.$t('Answers'), value: 'responses', sortable: true }
      ]
    },
    projectId(): string {
      return this.$route.params.id
    },
    // Extrai as perguntas disponíveis dos itens
    availableQuestions() {
      const questionsSet = new Set<string>()
      this.items.forEach(item => {
        if (Array.isArray(item.questions)) {
          item.questions.forEach(q => {
            if (q.question) {
              questionsSet.add(q.question)
            }
          })
        }
      })
      return Array.from(questionsSet)
    },
    // Computa os itens para a tabela a partir dos IDs de 0 a 100
    processedItems() {
      const result: Array<{ id: number; memberName: string; responsesText: string }> = []
      // Percorre os IDs de 0 a 100
      for (let memberId = 0; memberId <= 100; memberId++) {
        const responses: string[] = []
        // Para cada item, verifica todas as questões e respostas
        this.items.forEach(item => {
          if (Array.isArray(item.questions)) {
            item.questions.forEach(q => {
              // Se uma pergunta estiver selecionada, filtra apenas as que casam
              if (this.selectedQuestion && q.question && q.question.toLowerCase() !== this.selectedQuestion.toLowerCase()) {
                return // passa para a próxima questão
              }
              if (Array.isArray(q.answers)) {
                q.answers.forEach((a: any) => {
                  // Verifica se existe o membro e se o id bate com o memberId corrente
                  if (a.member) {
                    // Se o membro for um objeto com id
                    if (typeof a.member === 'object' && a.member.id === memberId) {
                      const answerText = (a.member.name ? a.member.name + ': ' : '') + (a.answer_text || a.answer_option || '')
                      responses.push(answerText)
                    }
                    // Se o membro for um número (id)
                    else if (typeof a.member === 'number' && a.member === memberId) {
                      const answerText = a.answer_text || a.answer_option || ''
                      responses.push(answerText)
                    }
                  }
                })
              }
            })
          }
        })
        // Apenas inclui o membro se houver respostas
        if (responses.length > 0) {
          const joinedResponses = responses.join('\n')
          const memberName = this.memberNames[memberId] || memberId.toString()
          // Aplica o filtro de busca: pesquisa no nome do membro e nas respostas
          if (this.search) {
            const searchLower = this.search.toLowerCase()
            if (
              !memberName.toLowerCase().includes(searchLower) &&
              !joinedResponses.toLowerCase().includes(searchLower)
            ) {
              continue // passa para o próximo memberId
            }
          }
          result.push({
            id: memberId,
            memberName,
            responsesText: joinedResponses
          })
        }
      }
      return result
    }
  },

  watch: {
    selectedQuestion(newVal) {
      console.log('selectedQuestion changed:', newVal)
    },
    // Quando os itens mudam, recarrega os nomes dos membros
    items: {
      handler() {
        this.$nextTick(() => {
          this.loadMemberNames()
        })
      },
      deep: true,
      immediate: true
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.loadMemberNames()
    })
  },

  methods: {
    // Verifica para cada ID de 0 a 100 se existe um membro e carrega o nome
    loadMemberNames() {
      for (let memberId = 0; memberId <= 100; memberId++) {
        this.$repositories.member.findById(this.projectId, memberId)
          .then((response: any) => {
            // Armazena o nome do membro conforme encontrado
            this.$set(this.memberNames, memberId, response.username)
            console.log(`Fetched member ${memberId}:`, response.username)
          })
          .catch(() => {
            console.log(`Member not found for ID ${memberId}`)
          })
      }
    }
  }
})
</script>

<style scoped>
.container {
  padding-left: 20px;
  padding-right: 20px;
  margin-top: 10px;
}
</style>
