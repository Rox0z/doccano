<template>
  <v-container>
    <v-card>
      <v-card-title class="headline">
        <v-btn icon @click.stop="goBack">
          <v-icon>{{ icons.mdiArrowLeft }}</v-icon>
        </v-btn>
        <span v-if="user">User Settings</span>
        <span v-else>Loading user profile...</span>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="errorMessage" type="error" dismissible>
          {{ errorMessage }}
        </v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>
          {{ successMessage }}
        </v-alert>

        <div v-if="user">
          <p>
            Username: {{ user.username }}
            <v-chip v-if="user.isStaff" color="amber" class="ml-2" x-small>Staff</v-chip>
            <v-chip v-if="user.isSuperUser" color="orange" class="ml-2" x-small>Admin</v-chip>
            <v-chip v-if="user.isActive" color="blue" class="ml-2" x-small>Active</v-chip>
            <v-chip v-else color="red" class="ml-2" x-small>Inactive</v-chip>
          </p>
          <p>Email: {{ user.email }}</p>
          <p>First name: {{ user.firstName }}</p>
          <p>Last name: {{ user.lastName }}</p>
          <p>Joined at: {{ new Date(user.dateJoined).toLocaleString() }}</p>
          <p v-if="user.groups && user.groups.length > 0">
            Groups:
            <v-chip 
              v-for="groupId in user.groups" 
              :key="groupId" 
              class="ml-2 mr-1 my-1" 
              small
            >
              {{ getUserGroupName(groupId) }}
            </v-chip>
          </p>
          <p v-else>Groups: <span class="grey--text">None</span></p>
        </div>

        <v-divider class="mb-5" />

        <v-form v-if="user" ref="form" @submit.prevent="updateUser">
          <h2 class="mb-5">Editar Usuário:</h2>

          <v-text-field v-model="editedUser.username" label="Nome de usuário" required />
          
          <!-- Novos campos adicionados -->
          <v-text-field 
            v-model="editedUser.firstName" 
            label="Primeiro Nome" 
            :rules="[v => !!v || 'Primeiro nome é obrigatório']"
            required 
          />
          <v-text-field 
            v-model="editedUser.lastName" 
            label="Sobrenome" 
            :rules="[v => !!v || 'Sobrenome é obrigatório']"
            required 
          />
          <v-text-field 
            v-model="editedUser.email" 
            label="Email" 
            type="email"
            :rules="[
              v => !!v || 'Email é obrigatório',
              v => /.+@.+\..+/.test(v) || 'Digite um email válido'
            ]"
            required 
          />
          
          <v-switch v-model="editedUser.isStaff" color="amber" label="Staff" />
          <v-switch v-model="editedUser.isSuperUser" color="orange" label="Administrator" />
          
          <v-card-subtitle>{{ $t('group.groups') || 'Groups' }}</v-card-subtitle>
          <v-autocomplete
            v-model="editedUser.selectedGroups"
            :items="availableGroups"
            :item-text="group => group.name"
            :item-value="group => group.id"
            :search-input.sync="groupsSearch"
            :label="$t('group.selectGroups') || 'Select Groups'"
            :no-data-text="$t('vuetify.noDataAvailable') || 'No data available'"
            :loading="loadingGroups"
            chips
            small-chips
            deletable-chips
            multiple
            clearable
            dense
            outlined
            hide-selected
            return-object
            @change="updateSelectedGroupIds"
          >
            <template #selection="{ item, index }">
              <v-chip
                v-if="index === 0"
                small
                close
                @click:close="removeGroup(item)"
              >
                <span>{{ item.name }}</span>
              </v-chip>
              <span v-if="index === 1" class="grey--text text-caption">
                (+{{ editedUser.selectedGroups.length - 1 }} {{ $t('generic.more') || 'more' }})
              </span>
            </template>
          </v-autocomplete>
          
          <div v-if="editedUser.selectedGroups && editedUser.selectedGroups.length > 0" class="mt-4">
            <div class="subtitle-1 mb-2">
              {{ $t('group.selectedGroups') || 'Selected Groups' }} ({{ editedUser.selectedGroups.length }})
            </div>
            <div class="selected-groups-container">
              <v-chip-group column>
                <v-chip
                  v-for="group in editedUser.selectedGroups"
                  :key="group.id"
                  small
                  close
                  class="ma-1"
                  @click:close="removeGroup(group)"
                >
                  {{ group.name }}
                </v-chip>
              </v-chip-group>
            </div>
          </div>

          <v-card-actions>
            <v-btn color="error" :disabled="loading" @click="handleSingleDelete">Excluir Usuário</v-btn>
            <v-spacer />
            <v-btn color="primary" class="mr-4" type="submit" :loading="loading" :disabled="loading">
              Atualizar Perfil
            </v-btn>
          </v-card-actions>
        </v-form>

        <v-progress-circular v-else indeterminate color="primary" />
      </v-card-text>
    </v-card>

    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card class="rounded-lg elevation-10">
        <!-- Cabeçalho azul com ícone -->
        <v-card-title class="white--text d-flex align-center" style="background-color: #1976d2;">
          <v-icon left class="mr-2">mdi-help-circle</v-icon>
          <span class="headline">Delete User</span>
        </v-card-title>

        <v-card-text class="pa-5 text-body-1 grey--text text--darken-3">
          Are you sure you want to delete this user? This action cannot be undone.
        </v-card-text>

        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn text @click="confirmDelete = false">Cancel</v-btn>
          <v-btn text class="red--text" :loading="deleteLoading" @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de erro -->
    <error-dialog :visible="errorDialog" :message="errorDialogMessage" @close="errorDialog = false" />
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { mdiArrowLeft } from '@mdi/js'
import ErrorDialog from '@/components/common/ErrorDialog.vue'
import { UserApplicationService } from '@/services/application/user/UserApplicationService'
import { GroupApplicationService } from '@/services/application/group/GroupApplicationService'
import { APIUserRepository } from '@/repositories/user/apiUserRepository'
import { APIGroupRepository } from '@/repositories/group/apiGroupRepository'
import { UserDetails } from '@/domain/models/user/user'
import { Group } from '@/domain/models/group/group'

export default Vue.extend({
  components: {
    ErrorDialog
  },
  layout: 'projects',
  data() {
    return {
      user: null as UserDetails | null,
      editedUser: {
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        isStaff: false,
        isSuperUser: false,
        groups: [] as number[],
        selectedGroups: [] as Group[]
      },
      availableGroups: [] as Group[],
      loadingGroups: false,
      groupsSearch: '',
      loading: false,
      deleteLoading: false,
      confirmDelete: false,
      errorDialog: false,
      errorDialogMessage: '',
      errorMessage: '',
      successMessage: '',
      icons: {
        mdiArrowLeft
      }
    }
  },

  async created() {
    await this.fetchUser()
    await this.fetchGroups()
  },

  methods: {
    async fetchUser() {
      try {
        const id = parseInt(this.$route.params.id)
        const userService = new UserApplicationService(new APIUserRepository())
        this.user = await userService.getUser(id)
        
        // Save the user data to editedUser
        this.editedUser = {
          username: this.user.username,
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          email: this.user.email,
          isStaff: this.user.isStaff,
          isSuperUser: this.user.isSuperUser,
          groups: this.user.groups || [],
          selectedGroups: [] // Will be populated after loading groups
        }
      } catch (error: any) {
        this.errorMessage = error.message
      }
    },

    async fetchGroups() {
      try {
        this.loadingGroups = true
        const groupService = new GroupApplicationService(new APIGroupRepository())
        const response = await groupService.listGroups()
        this.availableGroups = response.results
        
        // Set the selected groups objects based on user's group IDs
        if (this.user && this.user.groups) {
          this.editedUser.selectedGroups = this.availableGroups.filter(group => 
            this.user!.groups!.includes(group.id)
          )
        }
      } catch (error: any) {
        this.errorMessage = `Failed to load groups: ${error.message}`
      } finally {
        this.loadingGroups = false
      }
    },
    
    removeGroup(group: Group) {
      this.editedUser.selectedGroups = this.editedUser.selectedGroups.filter(g => g.id !== group.id)
      this.updateSelectedGroupIds()
    },
    
    updateSelectedGroupIds() {
      this.editedUser.groups = this.editedUser.selectedGroups.map(group => group.id)
    },

    getUserGroupName(groupId: number): string {
      // Try to find the group name from availableGroups first
      const group = this.availableGroups.find(g => g.id === groupId)
      if (group) return group.name

      // If not found, try the user's groupsDetails
      if (this.user?.groupsDetails && this.user.groupsDetails[groupId]) {
        return this.user.groupsDetails[groupId].name
      }
      
      // Fallback
      return `Group ${groupId}`
    },

    translateErrorMessage(errorMessage: string): string {
      // Traduções de mensagens de erro comuns
      const translations: { [key: string]: string } = {
        'A user with this email already exists.': 'Este email já está sendo usado por outro usuário. Por favor, escolha um email diferente.',
        'This field may not be blank.': 'Este campo não pode estar vazio.',
        'Enter a valid email address.': 'Digite um endereço de email válido.',
        'A user with that username already exists.': 'Este nome de usuário já está sendo usado. Por favor, escolha outro nome de usuário.',
        'Username: A user with that username already exists.': 'Nome de usuário: Este nome já está sendo usado. Por favor, escolha outro nome de usuário.',
        'Email: A user with this email already exists.': 'Email: Este email já está sendo usado por outro usuário. Por favor, escolha um email diferente.',
      }
      
      // Verifica se há uma tradução exata
      if (translations[errorMessage]) {
        return translations[errorMessage]
      }
      
      // Verifica se a mensagem já está em português (nossa validação do backend)
      if (errorMessage.includes('Este email já está sendo usado')) {
        return errorMessage
      }
      
      // Para mensagens que começam com "Email:", traduz apenas a parte específica
      if (errorMessage.startsWith('Email:')) {
        const emailError = errorMessage.replace('Email: ', '')
        if (translations[`Email: ${emailError}`]) {
          return translations[`Email: ${emailError}`]
        }
        return `Email: ${emailError}`
      }
      
      return errorMessage
    },

    async updateUser() {
      try {
        this.loading = true
        this.errorMessage = ''
        this.successMessage = ''

        const id = parseInt(this.$route.params.id)
        const userService = new UserApplicationService(new APIUserRepository())
        await userService.updateUser(id, {
          username: this.editedUser.username,
          first_name: this.editedUser.firstName,
          last_name: this.editedUser.lastName,
          email: this.editedUser.email,
          is_staff: this.editedUser.isStaff,
          is_superuser: this.editedUser.isSuperUser,
          groups: this.editedUser.groups // Using the array of IDs
        })

        this.successMessage = 'Perfil do usuário atualizado com sucesso!'
        await this.fetchUser()
        await this.fetchGroups() // Re-fetch groups to update the selection
      } catch (error: any) {
        this.errorMessage = this.translateErrorMessage(error.message)
      } finally {
        this.loading = false
      }
    },

    handleSingleDelete() {
      if (this.user?.isSuperUser || this.user?.isStaff) {
        this.errorDialogMessage = `Cannot delete: ${this.user.username}. Admins and staff cannot be deleted.`
        this.errorDialog = true
        return
      }
      this.confirmDelete = true
    },

    async deleteUser() {
      try {
        this.deleteLoading = true
        this.errorMessage = ''

        const id = parseInt(this.$route.params.id)
        const userService = new UserApplicationService(new APIUserRepository())
        await userService.deleteUser(id)

        this.confirmDelete = false
        this.$router.push('/users')
      } catch (error: any) {
        if (
          error.message.includes('Failed to fetch') || // fetch padrão
          error.message.includes('Network Error') ||    // Axios/network
          error.message.includes('ECONNREFUSED') ||     // Node.js/axios backend offline
          error.message.includes('502') ||              // Bad Gateway (nginx etc.)
          error.message.includes('504') ||              // Gateway Timeout
          error.message.includes('Failed to delete user') // custom errors
        ) {
          this.errorDialogMessage =
            'Unable to delete user: database connection failed. Check if the server is up.'
        } else {
          this.errorDialogMessage = error.message
        }
        this.errorDialog = true
        this.confirmDelete = false
      } finally {
        this.deleteLoading = false
      }
    },

    goBack() {
      this.$router.go(-1)
    }
  }
})
</script>

<style lang="scss" scoped>
.selected-groups-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  background-color: #fafafa;
}
</style>
