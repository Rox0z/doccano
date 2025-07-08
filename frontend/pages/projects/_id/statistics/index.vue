<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <!-- Header -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="primary" size="32">{{ mdiChartBar }}</v-icon>
            <h2>Statistics</h2>
            <v-spacer />
            <v-btn
              color="primary"
              class="mr-2"
              :loading="exporting"
              @click.stop.prevent="exportToPDF"
            >
              <v-icon left>{{ mdiFileDocumentOutline }}</v-icon>
              Export PDF
            </v-btn>
            <v-btn
              color="success"
              :loading="exporting"
              @click.stop.prevent="exportToCSV"
            >
              <v-icon left>{{ mdiFileDelimited }}</v-icon>
              Export CSV
            </v-btn>
          </v-card-title>
        </v-card>

        <!-- Filters Section -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left>{{ mdiFilter }}</v-icon>
            Filters
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- Dataset Text Filter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.textFilter"
                  :items="availableTexts"
                  item-text="preview"
                  item-value="value"
                  label="Filter by Dataset Text"
                  prepend-icon="mdi-text"
                  clearable
                  placeholder="Select text from dataset..."
                  @change="applyFilters"
                />
              </v-col>

              <!-- Discrepancy Filter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.discrepancyFilter"
                  :items="discrepancyOptions"
                  label="Discrepancy Filter"
                  prepend-icon="mdi-alert-circle"
                  clearable
                  @change="applyFilters"
                />
              </v-col>

              <!-- User Filter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.userFilter"
                  :items="availableUsers"
                  item-text="username"
                  item-value="id"
                  label="Filter by User"
                  prepend-icon="mdi-account"
                  multiple
                  chips
                  clearable
                  @change="applyFilters"
                >
                  <template #selection="{ item, index }">
                    <v-chip
                      v-if="index < 2"
                      :key="item.id"
                      color="secondary"
                      text-color="white"
                      small
                      close
                      @click:close="removeUserFilter(item)"
                    >
                      {{ item.username }}
                    </v-chip>
                    <span
                      v-if="index === 2"
                      class="text-grey text-caption"
                    >
                      (+{{ filters.userFilter.length - 2 }} others)
                    </span>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <!-- Label Filter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.labelFilter"
                  :items="availableLabels"
                  label="Filter by Label"
                  prepend-icon="mdi-tag"
                  clearable
                  @change="applyFilters"
                />
              </v-col>

              <!-- Perspective Filter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.perspectiveFilter"
                  :items="availablePerspectives"
                  item-text="text"
                  item-value="id"
                  label="Filter by Perspective"
                  prepend-icon="mdi-eye"
                  clearable
                  @change="onPerspectiveFilterChange"
                />
              </v-col>

              <!-- Answer Filter (only show when perspective is selected) -->
              <v-col v-if="filters.perspectiveFilter" cols="12" md="4">
                <v-select
                  v-model="filters.answerFilter"
                  :items="availableAnswers"
                  item-text="text"
                  item-value="value"
                  label="Filter by Answer"
                  prepend-icon="mdi-comment-text"
                  clearable
                  :loading="loadingAnswers"
                  @change="applyFilters"
                />
              </v-col>

              <!-- Active Filters Display -->
              <v-col v-else cols="12" md="4"></v-col>
              <v-col cols="12" md="4">
                <div v-if="hasActiveFilters" class="d-flex flex-wrap">
                  <v-chip
                    v-if="filters.textFilter"
                    color="primary"
                    class="mr-2 mb-2"
                    close
                    @click:close="clearFilter('textFilter')"
                  >
                    <v-icon left small>mdi-text</v-icon>
                    Text: {{ filters.textFilter.substring(0, 20) }}...
                  </v-chip>
                  <v-chip
                    v-if="filters.discrepancyFilter"
                    color="warning"
                    class="mr-2 mb-2"
                    close
                    @click:close="clearFilter('discrepancyFilter')"
                  >
                    <v-icon left small>mdi-alert-circle</v-icon>
                    {{ filters.discrepancyFilter }}
                  </v-chip>
                  <template v-if="filters.userFilter && filters.userFilter.length > 0">
                    <v-chip
                      v-for="userId in filters.userFilter"
                      :key="userId"
                      color="secondary"
                      class="mr-2 mb-2"
                      close
                      @click:close="removeUserFilter(userId)"
                    >
                      <v-icon left small>mdi-account</v-icon>
                      {{ getUsernameById(userId) }}
                    </v-chip>
                  </template>
                  <v-chip
                    v-if="filters.labelFilter"
                    color="success"
                    class="mr-2 mb-2"
                    close
                    @click:close="clearFilter('labelFilter')"
                  >
                    <v-icon left small>mdi-tag</v-icon>
                    {{ filters.labelFilter }}
                  </v-chip>
                  <v-chip
                    v-if="filters.perspectiveFilter"
                    color="info"
                    class="mr-2 mb-2"
                    close
                    @click:close="clearPerspectiveFilter"
                  >
                    <v-icon left small>mdi-eye</v-icon>
                    {{ getPerspectiveNameById(filters.perspectiveFilter) }}
                  </v-chip>
                  <v-chip
                    v-if="filters.answerFilter"
                    color="purple"
                    class="mr-2 mb-2"
                    close
                    @click:close="clearFilter('answerFilter')"
                  >
                    <v-icon left small>mdi-comment-text</v-icon>
                    Answer: {{ filters.answerFilter.substring(0, 20) }}{{ filters.answerFilter.length > 20 ? '...' : '' }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Statistics Overview Cards (only when filters other than text/discrepancy alone are active) -->
        <v-row v-if="showOverviewCards" class="mb-4">
          <v-col cols="12" md="3">
            <v-card class="text-center" color="primary" dark>
              <v-card-text>
                <v-icon size="48" class="mb-2">mdi-file-document-multiple</v-icon>
                <div class="text-h3 font-weight-bold">{{ filteredStats.totalExamples || 0 }}</div>
                <div class="text-subtitle-1">Total Examples</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="text-center" color="success" dark>
              <v-card-text>
                <v-icon size="48" class="mb-2">mdi-tag-multiple</v-icon>
                <div class="text-h3 font-weight-bold">{{ filteredStats.totalLabels || 0 }}</div>
                <div class="text-subtitle-1">Total Labels</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="text-center" color="info" dark>
              <v-card-text>
                <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
                <div class="text-h3 font-weight-bold">{{ filteredStats.totalUsers || 0 }}</div>
                <div class="text-subtitle-1">Active Users</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="text-center" color="warning" dark>
              <v-card-text>
                <v-icon size="48" class="mb-2">mdi-alert-circle</v-icon>
                <div class="text-h3 font-weight-bold">{{ filteredStats.discrepancyRate || 0 }}%</div>
                <div class="text-subtitle-1">Discrepancy Rate</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dataset Details Table -->
        <div v-if="shouldShowDatasetDetails" class="mb-6">
          <v-card>
            <v-card-title>
              <v-icon left color="primary">mdi-table</v-icon>
              <h3>{{ getDatasetDetailsTitle() }}</h3>
              <v-spacer />
              <v-chip color="info" text-color="white">
                {{ filteredDatasetDetails.length }} examples
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="datasetDetailsHeaders"
                :items="filteredDatasetDetails"
                :items-per-page="10"
                :loading="loading"
                class="elevation-0"
                dense
              >
                <template #[`item.text`]="{ item }">
                  <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                      <span 
                        style="cursor: pointer; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;"
                        v-bind="attrs" 
                        v-on="on"
                      >
                        {{ item.text }}
                      </span>
                    </template>
                    <span>{{ item.full_text }}</span>
                  </v-tooltip>
                </template>
                
                <template #[`item.discrepancy`]="{ item }">
                  <v-chip 
                    small 
                    :color="item.discrepancy === 'Yes' ? 'error' : 'success'"
                    :text-color="'white'"
                  >
                    {{ item.discrepancy }}
                  </v-chip>
                </template>
                
                <template #[`item.participation`]="{ item }">
                  <div class="d-flex align-center">
                    <span class="text-caption mr-2" style="min-width: 40px;">
                      {{ item.participationNumbers }}
                    </span>
                    <v-progress-linear
                      :value="item.participationPercentage"
                      height="8"
                      :color="getParticipationColor(item.participationPercentage)"
                      rounded
                      class="flex-grow-1"
                    />
                    <span class="text-caption ml-2">
                      {{ Math.round(item.participationPercentage) }}%
                    </span>
                  </div>
                  <div class="text-caption text--secondary mt-1">
                    {{ item.participationUsers }}
                  </div>
                </template>
                
                <template #[`item.annotations`]="{ item }">
                  <div v-if="item.annotationDetails && item.annotationDetails.length > 0">
                    <v-chip
                      v-for="(annotation, index) in item.annotationDetails.slice(0, 3)"
                      :key="index"
                      small
                      :color="getLabelColor(annotation.label)"
                      text-color="white"
                      class="mr-1 mb-1"
                      style="cursor: pointer;"
                      @click="showAnnotationDetails(annotation, item)"
                    >
                      {{ annotation.label }}
                      <v-icon v-if="annotation.users && annotation.users.length > 1" small right>mdi-account-multiple</v-icon>
                      <v-icon v-else small right>mdi-account</v-icon>
                      <v-chip 
                        v-if="annotation.users && annotation.users.length > 1"
                        x-small 
                        color="white" 
                        text-color="primary"
                        class="ml-1"
                        style="font-size: 10px;"
                      >
                        {{ annotation.users.length }}
                      </v-chip>
                    </v-chip>
                    <v-chip
                      v-if="item.annotationDetails.length > 3"
                      small
                      color="grey"
                      text-color="white"
                      class="mr-1 mb-1"
                      style="cursor: pointer;"
                      @click="showAllAnnotations(item)"
                    >
                      +{{ item.annotationDetails.length - 3 }}
                    </v-chip>
                  </div>
                  <div v-else class="text-caption text--secondary">
                    No annotations
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </div>

        <!-- User Details Table -->
        <div v-if="shouldShowUserDetails" class="mb-6">
          <v-card>
            <v-card-title>
              <v-icon left color="secondary">mdi-account-group</v-icon>
              <h3>{{ getUserDetailsTitle() }}</h3>
              <v-spacer />
              <v-chip color="secondary" text-color="white">
                {{ hasUserFilter || hasPerspectiveAnswerFilter ? filteredUserDetails.length : userDetails.length }} users
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="userDetailsHeaders"
                :items="hasUserFilter ? filteredUserDetails : userDetails"
                :items-per-page="10"
                :loading="loading"
                class="elevation-0"
                dense
              >
                <template #[`item.username`]="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="24" class="mr-2" color="primary">
                      <span class="white--text text-caption">{{ item.username.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                    <span class="font-weight-medium">{{ item.username }}</span>
                  </div>
                </template>
                
                <template #[`item.textsLabeled`]="{ item }">
                  <div class="d-flex align-center">
                    <span class="text-body-2 mr-2">
                      {{ item.textsLabeled }} / {{ item.textsAssigned }}
                    </span>
                    <v-progress-linear
                      :value="item.textLabelingPercentage"
                      height="6"
                      :color="getTextLabelingColor(item.textLabelingPercentage)"
                      rounded
                      class="flex-grow-1"
                      style="max-width: 100px;"
                    />
                  </div>
                </template>
                
                <template #[`item.totalLabels`]="{ item }">
                  <v-chip 
                    small 
                    :color="getTotalLabelsColor(item.totalLabels)"
                    text-color="white"
                  >
                    {{ item.totalLabels }}
                  </v-chip>
                </template>
                
                <template #[`item.participation`]="{ item }">
                  <div class="d-flex align-center">
                    <v-progress-circular
                      :value="item.participation"
                      :color="getParticipationColor(item.participation)"
                      size="40"
                      width="4"
                      class="mr-2"
                    >
                      <span class="text-caption">{{ Math.round(item.participation) }}%</span>
                    </v-progress-circular>
                    <span class="text-caption text--secondary">
                      {{ item.participation >= 80 ? 'High' : item.participation >= 50 ? 'Medium' : 'Low' }}
                    </span>
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </div>

        <!-- Perspective Details Table -->
        <div v-if="shouldShowPerspectiveDetails" class="mb-6">
          <v-card>
            <v-card-title>
              <v-icon left color="info">mdi-eye-outline</v-icon>
              <h3>{{ hasActiveFilters ? 'Filtered Perspective Details' : 'Perspective Details' }}</h3>
              <v-spacer />
              <v-chip color="info" text-color="white">
                {{ (hasUserFilter || hasPerspectiveFilter) ? filteredPerspectiveDetails.length : perspectiveDetails.length }} questions
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="perspectiveDetailsHeaders"
                :items="(hasUserFilter || hasPerspectiveFilter) ? filteredPerspectiveDetails : perspectiveDetails"
                :items-per-page="10"
                :loading="loading"
                class="elevation-0"
                dense
              >
                <template #[`item.question`]="{ item }">
                  <div class="d-flex align-center">
                    <v-icon small class="mr-2" :color="item.type === 'open' ? 'primary' : 'secondary'">
                      {{ item.type === 'open' ? 'mdi-text-box' : 'mdi-format-list-bulleted' }}
                    </v-icon>
                    <span class="font-weight-medium" :title="item.question">
                      {{ item.question.length > 50 ? item.question.substring(0, 50) + '...' : item.question }}
                    </span>
                  </div>
                </template>
                
                <template #[`item.type`]="{ item }">
                  <v-chip 
                    small 
                    :color="item.type === 'open' ? 'primary' : 'secondary'"
                    text-color="white"
                  >
                    {{ item.type === 'open' ? 'Open Text' : 'Multiple Choice' }}
                  </v-chip>
                </template>
                
                <template #[`item.answers`]="{ item }">
                  <div class="d-flex align-center">
                    <v-chip 
                      small 
                      :color="getAnswersColor(item.answers)"
                      text-color="white"
                      class="mr-2"
                    >
                      {{ item.answers }}
                    </v-chip>
                    <v-progress-linear
                      :value="item.responseRate"
                      height="6"
                      :color="getResponseRateColor(item.responseRate)"
                      rounded
                      class="flex-grow-1"
                      style="max-width: 120px;"
                    />
                    <span class="text-caption ml-2">{{ Math.round(item.responseRate) }}%</span>
                  </div>
                </template>
                
                <template #[`item.actions`]="{ item }">
                  <v-btn
                    small
                    color="info"
                    outlined
                    @click="showPerspectiveAnswers(item)"
                  >
                    <v-icon left small>mdi-eye</v-icon>
                    View Answers
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </div>

        <!-- Annotation Details Dialog -->
        <v-dialog v-model="annotationDialog" max-width="600">
          <v-card>
            <v-card-title class="headline">
              <v-icon left color="primary">mdi-tag</v-icon>
              Annotation Details
            </v-card-title>
            <v-card-text>
              <div v-if="selectedAnnotation">
                <v-chip
                  large
                  :color="getLabelColor(selectedAnnotation.label)"
                  text-color="white"
                  class="mb-3"
                >
                  {{ selectedAnnotation.label }}
                </v-chip>
                
                <h4 class="mb-2">
                  Annotated by {{ selectedAnnotation.users ? selectedAnnotation.users.length : 0 }} 
                  {{ selectedAnnotation.users && selectedAnnotation.users.length === 1 ? 'user' : 'users' }}:
                </h4>
                <div v-if="selectedAnnotation.users && selectedAnnotation.users.length > 0">
                  <v-chip
                    v-for="user in selectedAnnotation.users"
                    :key="user.id"
                    color="info"
                    text-color="white"
                    class="mr-2 mb-2"
                  >
                    <v-icon left small>mdi-account</v-icon>
                    {{ user.username }}
                  </v-chip>
                </div>
                <div v-else>
                  <span class="text--secondary">No user information available</span>
                </div>

                <div v-if="selectedAnnotation.positions && selectedAnnotation.positions.length > 0" class="mt-3">
                  <h4>Positions:</h4>
                  <div v-for="(position, index) in selectedAnnotation.positions" :key="index" class="mb-1">
                    <v-chip small outlined color="primary" class="mr-1">
                      {{ position.start }} - {{ position.end }}
                    </v-chip>
                  </div>
                </div>

                <div v-if="selectedAnnotation.types && selectedAnnotation.types.length > 0" class="mt-3">
                  <h4>Annotation Types:</h4>
                  <div>
                    <v-chip 
                      v-for="type in selectedAnnotation.types" 
                      :key="type"
                      small 
                      :color="type === 'span' ? 'purple' : 'orange'"
                      text-color="white"
                      class="mr-1"
                    >
                      {{ type }}
                    </v-chip>
                  </div>
                </div>

                <div v-if="selectedExample" class="mt-3">
                  <h4>Example Text:</h4>
                  <v-card outlined class="pa-3 mt-2">
                    <p class="text-body-2">{{ selectedExample.full_text || selectedExample.text }}</p>
                  </v-card>
                </div>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="annotationDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- All Annotations Dialog -->
        <v-dialog v-model="allAnnotationsDialog" max-width="800">
          <v-card>
            <v-card-title class="headline">
              <v-icon left color="primary">mdi-tag-multiple</v-icon>
              All Annotations
            </v-card-title>
            <v-card-text>
              <div v-if="selectedExample && selectedExample.annotationDetails">
                <div class="mb-3">
                  <strong>Example:</strong> {{ selectedExample.text }}
                </div>
                <v-divider class="my-3"></v-divider>
                <div v-for="(annotation, index) in selectedExample.annotationDetails" :key="index" class="mb-3">
                  <v-card outlined class="pa-3">
                    <div class="d-flex align-center mb-2">
                      <v-chip
                        :color="getLabelColor(annotation.label)"
                        text-color="white"
                        class="mr-2"
                      >
                        {{ annotation.label }}
                      </v-chip>
                      <div class="ml-2">
                        <div v-if="annotation.users && annotation.users.length > 0" class="text--secondary">
                          <strong>Annotated by {{ annotation.users.length }} {{ annotation.users.length === 1 ? 'user' : 'users' }}:</strong>
                          <div class="mt-1">
                            <v-chip
                              v-for="user in annotation.users"
                              :key="user.id"
                              x-small
                              color="info"
                              text-color="white"
                              class="mr-1"
                            >
                              {{ user.username }}
                            </v-chip>
                          </div>
                        </div>
                        <div v-else class="text--secondary">
                          No user information
                        </div>
                      </div>
                    </div>
                    
                    <div v-if="annotation.positions && annotation.positions.length > 0" class="text-caption text--secondary mb-1">
                      <strong>Positions:</strong>
                      <span v-for="(position, posIndex) in annotation.positions" :key="posIndex">
                        {{ position.start }}-{{ position.end }}<span v-if="posIndex < annotation.positions.length - 1">, </span>
                      </span>
                    </div>
                    
                    <div v-if="annotation.types && annotation.types.length > 0" class="text-caption text--secondary">
                      <strong>Types:</strong>
                      <v-chip 
                        v-for="type in annotation.types" 
                        :key="type"
                        x-small 
                        :color="type === 'span' ? 'purple' : 'orange'"
                        text-color="white"
                        class="mr-1"
                      >
                        {{ type }}
                      </v-chip>
                    </div>
                  </v-card>
                </div>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="allAnnotationsDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Perspective Answers Dialog -->
        <v-dialog v-model="perspectiveAnswersDialog" max-width="900">
          <v-card>
            <v-card-title class="headline">
              <v-icon left color="info">mdi-eye-outline</v-icon>
              <div>
                <span>Perspective Answers</span>
                <div v-if="filters.answerFilter" class="text-subtitle-2 text--secondary">
                  Filtered by answer: "{{ filters.answerFilter.length > 30 ? filters.answerFilter.substring(0, 30) + '...' : filters.answerFilter }}"
                </div>
              </div>
            </v-card-title>
            <v-card-text>
              <div v-if="selectedPerspective">
                <!-- Question Information -->
                <v-card outlined class="mb-4">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-chip 
                        :color="selectedPerspective.type === 'open' ? 'primary' : 'secondary'"
                        text-color="white"
                        class="mr-2"
                      >
                        {{ selectedPerspective.type === 'open' ? 'Open Text' : 'Multiple Choice' }}
                      </v-chip>
                      <span class="text-h6">{{ selectedPerspective.question }}</span>
                    </div>
                    <div class="text-body-2 text--secondary">
                      <span v-if="filters.answerFilter || (filters.userFilter && filters.userFilter.length > 0)">
                        Showing {{ perspectiveAnswersList.length }} of {{ selectedPerspective.answers }} answers 
                      </span>
                      <span v-else>
                        {{ selectedPerspective.answers }} answers 
                      </span>
                      • {{ Math.round(selectedPerspective.responseRate) }}% response rate
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Answers List -->
                <div v-if="perspectiveAnswersList && perspectiveAnswersList.length > 0">
                  <h4 class="mb-3">
                    <span v-if="filters.answerFilter">Filtered Responses:</span>
                    <span v-else>Responses:</span>
                  </h4>
                  <v-card
                    v-for="(answer, index) in perspectiveAnswersList"
                    :key="index"
                    outlined
                    class="mb-3"
                  >
                    <v-card-text>
                      <div class="d-flex justify-space-between align-start">
                        <div class="flex-grow-1">
                          <!-- For Open Text Questions -->
                          <div v-if="selectedPerspective.type === 'open'" class="text-body-1 mb-2">
                            <strong>{{ answer.text || 'No response provided' }}</strong>
                          </div>
                          
                          <!-- For Multiple Choice Questions -->
                          <div v-else class="text-body-1 mb-2">
                            <strong>{{ answer.selectedOption || 'No option selected' }}</strong>
                            <div v-if="answer.text" class="text-body-2 text--secondary mt-1">
                              <em>Additional comment: {{ answer.text }}</em>
                            </div>
                          </div>
                        </div>
                        <div class="d-flex align-center">
                          <v-chip
                            small
                            color="info"
                            text-color="white"
                          >
                            <v-icon left small>mdi-account</v-icon>
                            {{ answer.username }}
                          </v-chip>
                          <span class="text-caption text--secondary ml-2">
                            {{ answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : '' }}
                          </span>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
                <div v-else class="text-center py-4">
                  <v-icon size="48" color="grey">mdi-comment-question-outline</v-icon>
                  <div class="text-h6 grey--text mt-2">No responses found</div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="perspectiveAnswersDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Main Statistics Content (only when filters other than text/discrepancy alone are active) -->
        <div v-if="showDetailedStats">
          <v-tabs v-model="activeTab" background-color="transparent" color="primary">
            <!-- Label Statistics Tab -->
            <v-tab>
              <v-icon left>mdi-tag-multiple</v-icon>
              Label Statistics
            </v-tab>

            <!-- User Performance Tab -->
            <v-tab>
              <v-icon left>mdi-account-star</v-icon>
              User Performance
            </v-tab>

            <!-- Discrepancy Analysis Tab -->
            <v-tab>
              <v-icon left>mdi-alert-circle-outline</v-icon>
              Discrepancy Analysis
            </v-tab>

            <!-- Perspective Insights Tab -->
            <v-tab>
              <v-icon left>mdi-eye-outline</v-icon>
              Perspective Insights
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="activeTab">
          <!-- Label Statistics Tab Content -->
          <v-tab-item>
            <v-row class="mt-4">
              <!-- Label Distribution Chart -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-chart-pie</v-icon>
                    Label Distribution
                  </v-card-title>
                  <v-card-text>
                    <div v-if="labelDistribution.length > 0">
                      <div v-for="(item, index) in labelDistribution.slice(0, 10)" :key="item.label" class="mb-3">
                        <div class="d-flex justify-space-between align-center mb-1">
                          <span class="font-weight-medium">{{ item.label }}</span>
                          <span class="text-caption">{{ item.count }} ({{ item.percentage }}%)</span>
                        </div>
                        <v-progress-linear
                          :value="item.percentage"
                          height="12"
                          :color="getChartColor(index)"
                          rounded
                        ></v-progress-linear>
                      </div>
                    </div>
                    <div v-else class="text-center py-8">
                      <v-icon size="64" color="grey">mdi-chart-pie</v-icon>
                      <div class="text-h6 grey--text mt-2">No label data available</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Label Details Table -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-table</v-icon>
                    Label Details
                  </v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="labelHeaders"
                      :items="labelDistribution"
                      :items-per-page="10"
                      :loading="loading"
                      class="elevation-0"
                      dense
                    >
                      <template #[`item.percentage`]="{ item }">
                        <v-chip small :color="getPercentageColor(item.percentage)">
                          {{ item.percentage }}%
                        </v-chip>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tab-item>

          <!-- User Performance Tab Content -->
          <v-tab-item>
            <v-row class="mt-4">
              <!-- User Performance Chart -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-chart-bar</v-icon>
                    User Performance
                  </v-card-title>
                  <v-card-text>
                    <div v-if="userPerformance.length > 0">
                      <div v-for="(user, index) in userPerformance.slice(0, 10)" :key="user.username" class="mb-3">
                        <div class="d-flex justify-space-between align-center mb-1">
                          <span class="font-weight-medium">{{ user.username }}</span>
                          <span class="text-caption">{{ user.totalLabels }} labels</span>
                        </div>
                        <v-progress-linear
                          :value="getRelativeUserPerformance(user.totalLabels)"
                          height="12"
                          :color="getChartColor(index)"
                          rounded
                        ></v-progress-linear>
                      </div>
                    </div>
                    <div v-else class="text-center py-8">
                      <v-icon size="64" color="grey">mdi-chart-bar</v-icon>
                      <div class="text-h6 grey--text mt-2">No user data available</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- User Details Table -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-account-star</v-icon>
                    User Details
                  </v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="userHeaders"
                      :items="userPerformance"
                      :items-per-page="10"
                      :loading="loading"
                      class="elevation-0"
                      dense
                    >
                      <template #[`item.totalLabels`]="{ item }">
                        <v-chip small :color="getTotalLabelsColor(item.totalLabels)">
                          {{ item.totalLabels }}
                        </v-chip>
                      </template>
                      <template #[`item.accuracy`]="{ item }">
                        <v-chip small :color="getAccuracyColor(item.accuracy)">
                          {{ item.accuracy }}%
                        </v-chip>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tab-item>

          <!-- Discrepancy Analysis Tab Content -->
          <v-tab-item>
            <v-row class="mt-4">
              <!-- Discrepancy Overview -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-alert-circle</v-icon>
                    Discrepancy Overview
                  </v-card-title>
                  <v-card-text>
                    <div v-if="discrepancyData.length > 0">
                      <div v-for="item in discrepancyData.slice(0, 10)" :key="item.example" class="mb-3">
                        <div class="d-flex justify-space-between align-center mb-1">
                          <span class="font-weight-medium">{{ item.example.substring(0, 40) }}...</span>
                          <span class="text-caption">{{ item.discrepancyRate }}% discrepancy</span>
                        </div>
                        <v-progress-linear
                          :value="item.discrepancyRate"
                          height="12"
                          :color="getDiscrepancyColor(item.discrepancyRate)"
                          rounded
                        ></v-progress-linear>
                      </div>
                    </div>
                    <div v-else class="text-center py-8">
                      <v-icon size="64" color="grey">mdi-alert-circle</v-icon>
                      <div class="text-h6 grey--text mt-2">No discrepancy data available</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Discrepancy Details Table -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-table</v-icon>
                    Discrepancy Details
                  </v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="discrepancyHeaders"
                      :items="discrepancyData"
                      :items-per-page="10"
                      :loading="loading"
                      class="elevation-0"
                      dense
                    >
                      <template #[`item.example`]="{ item }">
                        <span :title="item.example">{{ item.example.substring(0, 40) }}...</span>
                      </template>
                      <template #[`item.discrepancyRate`]="{ item }">
                        <v-chip small :color="getDiscrepancyColor(item.discrepancyRate)">
                          {{ item.discrepancyRate }}%
                        </v-chip>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tab-item>

          <!-- Perspective Insights Tab Content -->
          <v-tab-item>
            <v-row class="mt-4">
              <!-- Perspective Overview -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-eye</v-icon>
                    Perspective Response Rates
                  </v-card-title>
                  <v-card-text>
                    <div v-if="perspectiveData.length > 0">
                      <div v-for="item in perspectiveData.slice(0, 10)" :key="item.question" class="mb-3">
                        <div class="d-flex justify-space-between align-center mb-1">
                          <span class="font-weight-medium">{{ item.question.substring(0, 40) }}...</span>
                          <span class="text-caption">{{ item.responseRate }}% response rate</span>
                        </div>
                        <v-progress-linear
                          :value="item.responseRate"
                          height="12"
                          :color="getResponseRateColor(item.responseRate)"
                          rounded
                        ></v-progress-linear>
                      </div>
                    </div>
                    <div v-else class="text-center py-8">
                      <v-icon size="64" color="grey">mdi-eye</v-icon>
                      <div class="text-h6 grey--text mt-2">No perspective data available</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Perspective Details Table -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <v-icon left>mdi-table</v-icon>
                    Perspective Details
                  </v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="perspectiveHeaders"
                      :items="perspectiveData"
                      :items-per-page="10"
                      :loading="loading"
                      class="elevation-0"
                      dense
                    >
                      <template #[`item.question`]="{ item }">
                        <span :title="item.question">{{ item.question.substring(0, 40) }}...</span>
                      </template>
                      <template #[`item.responseRate`]="{ item }">
                        <v-chip small :color="getResponseRateColor(item.responseRate)">
                          {{ item.responseRate }}%
                        </v-chip>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tab-item>
          </v-tabs-items>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { mdiChartBar, mdiDownload, mdiFilter, mdiFileDocumentOutline, mdiFileDelimited } from '@mdi/js'

export default {
  layout: 'project',
  middleware: ['check-auth', 'auth', 'setCurrentProject', 'isProjectAdmin'],

  validate({ params }) {
    return /^\d+$/.test(params.id)
  },

  data() {
    return {
      mdiChartBar,
      mdiDownload,
      mdiFilter,
      mdiFileDocumentOutline,
      mdiFileDelimited,
      
      // Navigation
      activeTab: 0,
      loading: false,
      exporting: false,

      // Filters
      filters: {
        textFilter: '',
        discrepancyFilter: null,
        userFilter: [],
        labelFilter: null,
        perspectiveFilter: null,
        answerFilter: null
      },

      discrepancyOptions: [
        { text: 'All', value: 'all' },
        { text: 'With Discrepancies', value: 'with' },
        { text: 'Without Discrepancies', value: 'without' }
      ],

      // Data
      stats: {},
      availableUsers: [],
      availableLabels: [],
      availablePerspectives: [],
      availableAnswers: [],
      availableTexts: [],
      loadingAnswers: false,
      datasetDetails: [],
      userDetails: [],
      perspectiveDetails: [],
      labelDistribution: [],
      userPerformance: [],
      discrepancyData: [],
      perspectiveData: [],

      // Table headers
      datasetDetailsHeaders: [
        { text: 'Text', value: 'text', sortable: false },
        { text: 'Discrepancy', value: 'discrepancy', sortable: true },
        { text: 'Participation', value: 'participation', sortable: false },
        { text: 'Annotations', value: 'annotations', sortable: false }
      ],

      userDetailsHeaders: [
        { text: 'Username', value: 'username', sortable: true },
        { text: 'Texts Labeled', value: 'textsLabeled', sortable: true },
        { text: 'Total Labels', value: 'totalLabels', sortable: true },
        { text: 'Participation', value: 'participation', sortable: true }
      ],

      perspectiveDetailsHeaders: [
        { text: 'Question', value: 'question', sortable: false },
        { text: 'Type', value: 'type', sortable: true },
        { text: 'Answers', value: 'answers', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false }
      ],

      labelHeaders: [
        { text: 'Label', value: 'label', sortable: true },
        { text: 'Count', value: 'count', sortable: true },
        { text: 'Percentage', value: 'percentage', sortable: true }
      ],
      
      userHeaders: [
        { text: 'User', value: 'username', sortable: true },
        { text: 'Total Labels', value: 'totalLabels', sortable: true },
        { text: 'Examples Labeled', value: 'examplesLabeled', sortable: true },
        { text: 'Accuracy', value: 'accuracy', sortable: true }
      ],

      discrepancyHeaders: [
        { text: 'Example', value: 'example', sortable: false },
        { text: 'Discrepancy Rate', value: 'discrepancyRate', sortable: true },
        { text: 'Conflicting Labels', value: 'conflictingLabels', sortable: false },
        { text: 'Annotators', value: 'annotators', sortable: true }
      ],

      perspectiveHeaders: [
        { text: 'Question', value: 'question', sortable: false },
        { text: 'Type', value: 'type', sortable: true },
        { text: 'Responses', value: 'responses', sortable: true },
        { text: 'Response Rate', value: 'responseRate', sortable: true }
      ],

      // Dialog states
      annotationDialog: false,
      allAnnotationsDialog: false,
      perspectiveAnswersDialog: false,
      selectedAnnotation: null,
      selectedExample: null,
      selectedPerspective: null,
      perspectiveAnswersList: []
    }
  },

  computed: {
    ...mapGetters('projects', ['project']),

    projectId() {
      return this.$route.params.id
    },

    hasActiveFilters() {
      return this.filters.textFilter || 
             this.filters.discrepancyFilter || 
             (this.filters.userFilter && this.filters.userFilter.length > 0) || 
             this.filters.labelFilter || 
             this.filters.perspectiveFilter ||
             this.filters.answerFilter
    },

    // Check which types of filters are active
    hasTextOrDiscrepancyFilter() {
      return this.filters.textFilter || this.filters.discrepancyFilter
    },

    hasLabelFilter() {
      return this.filters.labelFilter
    },

    hasUserFilter() {
      return this.filters.userFilter && this.filters.userFilter.length > 0
    },

    hasPerspectiveFilter() {
      return this.filters.perspectiveFilter
    },

    hasAnswerFilter() {
      return this.filters.answerFilter
    },

    hasPerspectiveAnswerFilter() {
      return this.filters.perspectiveFilter && this.filters.answerFilter
    },

    // Determine which tables should be shown based on active filter types
    shouldShowDatasetDetails() {
      // Show when no filters are active OR when specific filters are active
      // When perspective + answer filter is active, show filtered dataset details
      return !this.hasActiveFilters || this.hasTextOrDiscrepancyFilter || this.hasLabelFilter || this.hasUserFilter || this.hasPerspectiveAnswerFilter
    },

    shouldShowUserDetails() {
      // Show when no filters are active OR when user filter is active OR when perspective + answer filter is active
      return !this.hasActiveFilters || this.hasUserFilter || this.hasPerspectiveAnswerFilter
    },

    shouldShowPerspectiveDetails() {
      // Show when no filters are active OR when perspective/user filter is active
      return !this.hasActiveFilters || this.hasPerspectiveFilter || this.hasUserFilter
    },

    // Show overview cards never (always hidden)
    showOverviewCards() {
      // Always hide overview cards
      return false
    },

    // Show detailed statistics tabs never (always hidden)
    showDetailedStats() {
      // Always hide detailed stats
      return false
    },

    // Check if only simple filters (text, discrepancy, label, or perspective) are active
    isSimpleFilter() {
      return (this.filters.textFilter && 
             !this.filters.discrepancyFilter && 
             (!this.filters.userFilter || this.filters.userFilter.length === 0) && 
             !this.filters.labelFilter && 
             !this.filters.perspectiveFilter) ||
             (this.filters.discrepancyFilter && 
             !this.filters.textFilter && 
             (!this.filters.userFilter || this.filters.userFilter.length === 0) && 
             !this.filters.labelFilter && 
             !this.filters.perspectiveFilter) ||
             (this.filters.labelFilter && 
             !this.filters.textFilter && 
             !this.filters.discrepancyFilter && 
             (!this.filters.userFilter || this.filters.userFilter.length === 0) && 
             !this.filters.perspectiveFilter) ||
             (this.filters.perspectiveFilter && 
             !this.filters.textFilter && 
             !this.filters.discrepancyFilter && 
             (!this.filters.userFilter || this.filters.userFilter.length === 0) && 
             !this.filters.labelFilter)
    },

    // Check if only user filter is active
    isUserFilterOnly() {
      return this.filters.userFilter && 
             this.filters.userFilter.length > 0 && 
             !this.filters.textFilter && 
             !this.filters.discrepancyFilter && 
             !this.filters.labelFilter && 
             !this.filters.perspectiveFilter
    },

    // Check if only perspective filter is active
    isPerspectiveFilterOnly() {
      return this.filters.perspectiveFilter && 
             !this.filters.textFilter && 
             !this.filters.discrepancyFilter && 
             (!this.filters.userFilter || this.filters.userFilter.length === 0) && 
             !this.filters.labelFilter
    },

    // Filter user details to show only selected users
    filteredUserDetails() {
      if (!this.hasUserFilter) {
        return this.userDetails
      }
      // When user filter is active, only show the selected users
      return this.userDetails.filter(user => {
        const userId = this.availableUsers.find(u => u.username === user.username)?.id
        return userId && this.filters.userFilter.includes(userId)
      })
    },

    // Filter perspective details to show only questions answered by selected users or specific perspective
    filteredPerspectiveDetails() {
      let filtered = this.perspectiveDetails
      
      // Apply perspective filter if active
      if (this.hasPerspectiveFilter) {
        filtered = filtered.filter(detail => detail.id === parseInt(this.filters.perspectiveFilter))
      }
      
      // Note: User filter is already applied on the backend - it only returns questions that the user answered
      // No additional filtering needed here for user filter
      
      return filtered
    },

    // Filter dataset details to show only examples where selected users participated
    filteredDatasetDetails() {
      if (!this.filters.userFilter || this.filters.userFilter.length === 0) {
        return this.datasetDetails
      }
      
      // When user filter is active, show only examples where selected users participated
      return this.datasetDetails.filter(detail => {
        // Check if any of the selected users participated in annotations
        const selectedUsernames = this.filters.userFilter.map(userId => {
          const user = this.availableUsers.find(u => u.id === parseInt(userId))
          return user ? user.username : null
        }).filter(Boolean)
        
        // Check if any selected user is in the annotating users list
        return detail.annotating_users && detail.annotating_users.some(username => 
          selectedUsernames.includes(username)
        )
      })
    },

    // Computed statistics based on filtered data
    filteredStats() {
      if (!this.filters.userFilter || this.filters.userFilter.length === 0) {
        return this.stats
      }
      
      // When user filter is active, calculate stats based on filtered data
      const filteredExamples = this.filteredDatasetDetails.length
      
      return {
        ...this.stats,
        totalExamples: filteredExamples
      }
    }
  },

  async created() {
    await this.loadInitialData()
  },

  methods: {
    async loadInitialData() {
      this.loading = true
      try {
        // Load available options for filters
        await this.loadFilterOptions()
        
        // Load statistics data
        await this.loadStatistics()
      } catch (error) {
        console.error('Error loading initial data:', error)
        if (this.$toast && typeof this.$toast.error === 'function') {
          this.$toast.error('Failed to load statistics data')
        } else {
          console.error('❌ Failed to load statistics data')
        }
      } finally {
        this.loading = false
      }
    },

    async loadFilterOptions() {
      try {
        // Load available users
        const labelStatsResponse = await this.$repositories.metrics.fetchLabelStats(this.projectId)
        this.availableUsers = labelStatsResponse.available_users || []
        this.availableLabels = labelStatsResponse.available_labels || []

        // Load available perspectives
        const perspectiveStatsResponse = await this.$repositories.metrics.fetchPerspectiveStats(this.projectId)
        this.availablePerspectives = perspectiveStatsResponse.available_questions || []

        // Load available texts for dropdown
        const textsResponse = await this.$repositories.metrics.fetchDatasetTexts(this.projectId)
        this.availableTexts = textsResponse.text_options || []
      } catch (error) {
        console.error('Error loading filter options:', error)
      }
    },

    async loadStatistics() {
      try {
        // Build filter parameters
        const params = this.buildFilterParams()

        // Always load dataset details with params to ensure perspective filtering works correctly
        const datasetDetailsResponse = await this.$repositories.metrics.fetchDatasetDetails(this.projectId, params)

        // Load all statistics data with filters applied
        const [labelStats, perspectiveStats, discrepancyStats] = await Promise.all([
          this.$repositories.metrics.fetchLabelStats(this.projectId, params),
          this.$repositories.metrics.fetchPerspectiveStats(this.projectId, params),
          this.$repositories.metrics.fetchDiscrepancyStats(this.projectId, params)
        ])

        // Process and set statistics data
        this.processStatisticsData(labelStats, perspectiveStats, discrepancyStats)
        
        // Set dataset details, user details and perspective details
        if (datasetDetailsResponse) {
          this.datasetDetails = datasetDetailsResponse.dataset_details || []
          this.userDetails = datasetDetailsResponse.user_details || []
          this.perspectiveDetails = datasetDetailsResponse.perspective_details || []
        } else {
          // Clear data when no response
          this.datasetDetails = []
          this.userDetails = []
          this.perspectiveDetails = []
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      }
    },

    buildFilterParams() {
      const params = {}
      
      if (this.filters.textFilter) {
        params.text = this.filters.textFilter
      }
      if (this.filters.userFilter && this.filters.userFilter.length > 0) {
        // For multiple users, pass as separate user_id parameters
        params.user_id = this.filters.userFilter
      }
      if (this.filters.labelFilter) {
        params.label = this.filters.labelFilter
      }
      if (this.filters.perspectiveFilter) {
        params.question_id = this.filters.perspectiveFilter
      }
      if (this.filters.answerFilter) {
        params.answer = this.filters.answerFilter
      }
      if (this.filters.discrepancyFilter && this.filters.discrepancyFilter !== 'all') {
        params.discrepancy = this.filters.discrepancyFilter
      }

      return params
    },

    processStatisticsData(labelStats, perspectiveStats, discrepancyStats) {
      // Overall stats
      this.stats = {
        totalExamples: labelStats.total_examples || 0,
        totalLabels: labelStats.total_labels || 0,
        totalUsers: labelStats.total_users || 0,
        discrepancyRate: Math.round(discrepancyStats.discrepancy_percentage || 0)
      }

      // Label distribution
      this.labelDistribution = (labelStats.label_distribution || []).map(item => ({
        label: item.label,
        count: item.count,
        percentage: Math.round(item.percentage || 0)
      }))

      // User performance
      this.userPerformance = (labelStats.user_performance || []).map(user => ({
        username: user.username,
        totalLabels: user.total_labels || 0,
        examplesLabeled: user.examples_labeled || 0,
        accuracy: Math.round(Math.random() * 20 + 80) // Simulated accuracy for now
      }))

      // Discrepancy data
      this.discrepancyData = (discrepancyStats.top_discrepant_examples || []).map(item => ({
        example: item.text || 'No text',
        discrepancyRate: Math.round(item.discrepancy_rate || 0),
        conflictingLabels: (item.conflicting_labels || []).join(', '),
        annotators: item.annotator_count || 0
      }))

      // Perspective data
      this.perspectiveData = (perspectiveStats.questions || []).map(question => ({
        question: question.text || 'No question text',
        type: question.question_type || 'unknown',
        responses: question.answer_count || 0,
        responseRate: Math.round(question.response_rate || 0)
      }))
    },

    async applyFilters() {
      this.loading = true
      try {
        await this.loadStatistics()
      } finally {
        this.loading = false
      }
    },

    clearFilter(filterName) {
      if (filterName === 'userFilter') {
        this.filters[filterName] = []
      } else {
        this.filters[filterName] = null
      }
      this.applyFilters()
    },

    clearPerspectiveFilter() {
      this.filters.perspectiveFilter = null
      this.filters.answerFilter = null
      this.availableAnswers = []
      this.applyFilters()
    },

    async onPerspectiveFilterChange() {
      // Clear answer filter when perspective changes
      this.filters.answerFilter = null
      this.availableAnswers = []
      
      if (this.filters.perspectiveFilter) {
        // Load available answers for the selected perspective
        await this.loadAvailableAnswers()
      }
      
      // Apply filters
      this.applyFilters()
    },

    async loadAvailableAnswers() {
      if (!this.filters.perspectiveFilter) {
        return
      }
      
      this.loadingAnswers = true
      try {
        const response = await this.$repositories.metrics.fetchAvailableAnswers(
          this.projectId, 
          this.filters.perspectiveFilter
        )
        this.availableAnswers = response.available_answers || []
      } catch (error) {
        console.error('Error loading available answers:', error)
        this.availableAnswers = []
      } finally {
        this.loadingAnswers = false
      }
    },

    removeUserFilter(userId) {
      if (typeof userId === 'object' && userId.id) {
        // Handle case where full user object is passed
        userId = userId.id
      }
      const index = this.filters.userFilter.indexOf(userId)
      if (index > -1) {
        this.filters.userFilter.splice(index, 1)
        this.applyFilters()
      }
    },

    getUsernamesDisplay() {
      if (!this.filters.userFilter || this.filters.userFilter.length === 0) {
        return ''
      }
      if (this.filters.userFilter.length === 1) {
        return this.getUsernameById(this.filters.userFilter[0])
      }
      if (this.filters.userFilter.length === 2) {
        return `${this.getUsernameById(this.filters.userFilter[0])}, ${this.getUsernameById(this.filters.userFilter[1])}`
      }
      return `${this.getUsernameById(this.filters.userFilter[0])}, ${this.getUsernameById(this.filters.userFilter[1])} (+${this.filters.userFilter.length - 2} others)`
    },

    getUsernameById(userId) {
      const user = this.availableUsers.find(u => u.id === parseInt(userId))
      return user ? user.username : 'Unknown User'
    },

    getPerspectiveNameById(perspectiveId) {
      const perspective = this.availablePerspectives.find(p => p.id === parseInt(perspectiveId))
      return perspective ? perspective.text.substring(0, 30) + '...' : 'Unknown Question'
    },

    getChartColor(index) {
      const colors = ['primary', 'success', 'warning', 'error', 'info', 'purple']
      return colors[index % colors.length]
    },

    getPercentageColor(percentage) {
      if (percentage >= 50) return 'success'
      if (percentage >= 25) return 'warning'
      return 'error'
    },

    getTotalLabelsColor(total) {
      if (total >= 100) return 'success'
      if (total >= 50) return 'warning'
      return 'error'
    },

    getAccuracyColor(accuracy) {
      if (accuracy >= 90) return 'success'
      if (accuracy >= 70) return 'warning'
      return 'error'
    },

    getDiscrepancyColor(rate) {
      if (rate >= 75) return 'error'
      if (rate >= 50) return 'warning'
      return 'success'
    },

    getResponseRateColor(rate) {
      if (rate >= 80) return 'success'
      if (rate >= 50) return 'warning'
      return 'error'
    },

    getRelativeUserPerformance(totalLabels) {
      if (this.userPerformance.length === 0) return 0
      const maxLabels = Math.max(...this.userPerformance.map(u => u.totalLabels))
      return maxLabels > 0 ? (totalLabels / maxLabels) * 100 : 0
    },

    getParticipationColor(percentage) {
      if (percentage >= 80) return 'success'
      if (percentage >= 50) return 'warning'
      return 'error'
    },

    getTextLabelingColor(percentage) {
      if (percentage >= 90) return 'success'
      if (percentage >= 70) return 'warning'
      return 'error'
    },

    getDatasetDetailsTitle() {
      if (this.hasPerspectiveAnswerFilter) {
        const perspectiveName = this.getPerspectiveNameById(this.filters.perspectiveFilter)
        const answerPreview = this.filters.answerFilter.length > 30 
          ? this.filters.answerFilter.substring(0, 30) + '...' 
          : this.filters.answerFilter
        return `Filtered Dataset Details - ${perspectiveName}: "${answerPreview}"`
      }
      
      if (this.hasUserFilter) {
        const userDisplay = this.getUsernamesDisplay()
        return `Filtered Dataset Details - ${userDisplay}`
      }
      
      if (this.hasActiveFilters) {
        return 'Filtered Dataset Details'
      }
      
      return 'Dataset Details'
    },

    getUserDetailsTitle() {
      if (this.hasPerspectiveAnswerFilter) {
        const perspectiveName = this.getPerspectiveNameById(this.filters.perspectiveFilter)
        const answerPreview = this.filters.answerFilter.length > 30 
          ? this.filters.answerFilter.substring(0, 30) + '...' 
          : this.filters.answerFilter
        return `Filtered User Details - Users who answered "${answerPreview}" to ${perspectiveName}`
      }
      
      if (this.hasUserFilter) {
        const userDisplay = this.getUsernamesDisplay()
        return `Filtered User Details - ${userDisplay}`
      }
      
      if (this.hasActiveFilters) {
        return 'Filtered User Details'
      }
      
      return 'User Details'
    },

    getAnswersColor(count) {
      if (count >= 10) return 'success'
      if (count >= 5) return 'warning'
      return 'info'
    },

    getLabelColor(label) {
      // Generate consistent colors for labels based on label name
      const colors = ['primary', 'success', 'warning', 'error', 'info', 'purple', 'teal', 'orange']
      let hash = 0
      for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash)
      }
      return colors[Math.abs(hash) % colors.length]
    },

    showAnnotationDetails(annotation, example) {
      this.selectedAnnotation = annotation
      this.selectedExample = example
      this.annotationDialog = true
    },

    showAllAnnotations(example) {
      this.selectedExample = example
      this.allAnnotationsDialog = true
    },

    async showPerspectiveAnswers(perspective) {
      this.selectedPerspective = perspective
      this.perspectiveAnswersDialog = true
      
      try {
        // Load perspective answers from backend with user filter if active
        const response = await this.$repositories.metrics.fetchPerspectiveAnswers(this.projectId, perspective.id)
        
        let filteredAnswers = response.answers || []
        
        // If answer filter is active, filter answers by the specific answer
        if (this.filters.answerFilter) {
          filteredAnswers = filteredAnswers.filter(answer => {
            // For open text questions, check text field
            if (perspective.type === 'open') {
              return answer.text && answer.text.toLowerCase().includes(this.filters.answerFilter.toLowerCase())
            } else {
              // For multiple choice questions, check selectedOption field
              return answer.selectedOption && answer.selectedOption.toLowerCase().includes(this.filters.answerFilter.toLowerCase())
            }
          })
        }
        
        // If user filter is active, filter answers by selected users
        if (this.filters.userFilter && this.filters.userFilter.length > 0) {
          const selectedUsernames = this.filters.userFilter.map(userId => {
            const user = this.availableUsers.find(u => u.id === parseInt(userId))
            return user ? user.username : null
          }).filter(Boolean)
          
          filteredAnswers = filteredAnswers.filter(answer => {
            return selectedUsernames.includes(answer.username)
          })
        }
        
        this.perspectiveAnswersList = filteredAnswers
      } catch (error) {
        console.error('Error loading perspective answers:', error)
        this.perspectiveAnswersList = []
        if (this.$toast && typeof this.$toast.error === 'function') {
          this.$toast.error('Failed to load perspective answers')
        } else {
          console.error('❌ Failed to load perspective answers')
        }
      }
    },

    async exportToPDF(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.exporting = true
      try {
        console.log('📄 Iniciando geração do PDF com gráficos...');
        
        // Verificar se há dados para exportar
        if ((!this.datasetDetails || this.datasetDetails.length === 0) && 
            (!this.userDetails || this.userDetails.length === 0) &&
            (!this.perspectiveDetails || this.perspectiveDetails.length === 0) &&
            (!this.labelDistribution || this.labelDistribution.length === 0)) {
          throw new Error('Não há dados para exportar no PDF.');
        }

        // Dynamic import to avoid SSR issues
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        // eslint-disable-next-line new-cap
        const doc = new jsPDF();
        
        let yPosition = 20;

        // Header do documento
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(63, 81, 181);
        doc.text('RELATÓRIO DE ESTATÍSTICAS', 14, yPosition);
        yPosition += 12;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Projeto: ${this.project.name}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, yPosition);
        yPosition += 12;

        // Active filters information
        if (this.hasActiveFilters) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(156, 39, 176);
          doc.text('FILTROS ATIVOS:', 14, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          if (this.filters.textFilter) {
            doc.text(`• Texto: ${this.filters.textFilter.substring(0, 50)}...`, 14, yPosition);
            yPosition += 6;
          }
          if (this.filters.discrepancyFilter) {
            doc.text(`• Discrepância: ${this.filters.discrepancyFilter}`, 14, yPosition);
            yPosition += 6;
          }
          if (this.filters.userFilter && this.filters.userFilter.length > 0) {
            const usernames = this.filters.userFilter.map(uid => this.getUsernameById(uid)).join(', ');
            doc.text(`• Utilizadores: ${usernames}`, 14, yPosition);
            yPosition += 6;
          }
          if (this.filters.labelFilter) {
            doc.text(`• Etiqueta: ${this.filters.labelFilter}`, 14, yPosition);
            yPosition += 6;
          }
          if (this.filters.perspectiveFilter) {
            const perspective = this.availablePerspectives.find(p => p.id === this.filters.perspectiveFilter);
            doc.text(`• Questão: ${perspective ? perspective.text.substring(0, 40) + '...' : 'N/A'}`, 14, yPosition);
            yPosition += 6;
          }
          if (this.filters.answerFilter) {
            doc.text(`• Resposta: ${this.filters.answerFilter.substring(0, 40)}...`, 14, yPosition);
            yPosition += 6;
          }
          yPosition += 8;
        }

        // Overall Statistics Table
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(63, 81, 181);
        doc.text('ESTATÍSTICAS GERAIS', 14, yPosition);
        yPosition += 8;

        const overallData = [
          ['Total de Exemplos', this.shouldShowDatasetDetails ? this.filteredDatasetDetails.length : this.stats.totalExamples],
          ['Total de Etiquetas', this.stats.totalLabels || 0],
          ['Total de Utilizadores', this.shouldShowUserDetails ? (this.hasUserFilter ? this.filteredUserDetails.length : this.userDetails.length) : this.stats.totalUsers],
          ['Taxa de Discrepância', `${this.stats.discrepancyRate || 0}%`]
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [['Métrica', 'Valor']],
          body: overallData,
          theme: 'grid',
          headStyles: {
            fillColor: [63, 81, 181],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 10,
            cellPadding: 4
          },
          columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 50, halign: 'center', fillColor: [248, 249, 250] }
          }
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Charts Section
        console.log('📊 Gerando gráficos para PDF...');
        
        try {
          // Import Chart.js compatible with v2.9.4
          const Chart = (await import('chart.js')).default;

          // Helper function to create charts and return as images (Chart.js v2.9.4 compatible)
          const createChartImage = (type, data, options = {}) => {
            return new Promise((resolve) => {
              const canvas = document.createElement('canvas');
              canvas.width = 500;
              canvas.height = 300;
              
              const ctx = canvas.getContext('2d');
              
              // Chart.js v2.9.4 compatible configuration
              const chartConfig = {
                type,
                data,
                options: {
                  responsive: false,
                  animation: {
                    duration: 0 // Disable animation
                  },
                  legend: {
                    position: 'bottom',
                    labels: {
                      fontSize: 12,
                      padding: 20
                    }
                  },
                  ...options
                }
              };
              
              const chart = new Chart(ctx, chartConfig);
              
              // Wait for chart to render then convert to image
              setTimeout(() => {
                const imageData = canvas.toDataURL('image/png');
                chart.destroy();
                resolve(imageData);
              }, 200);
            });
          };

          // Overall Statistics Chart (Bar Chart)
          if (yPosition > 180) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 152, 0);
          doc.text('GRÁFICO DE ESTATÍSTICAS GERAIS', 14, yPosition);
          yPosition += 12;

          const overallChartData = {
            labels: ['Exemplos', 'Etiquetas', 'Utilizadores', 'Taxa Discrepância (%)'],
            datasets: [{
              label: 'Estatísticas',
              data: [
                this.shouldShowDatasetDetails ? this.filteredDatasetDetails.length : this.stats.totalExamples,
                this.stats.totalLabels || 0,
                this.shouldShowUserDetails ? (this.hasUserFilter ? this.filteredUserDetails.length : this.userDetails.length) : this.stats.totalUsers,
                this.stats.discrepancyRate || 0
              ],
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
              borderColor: ['#FF4757', '#2F80ED', '#FFA502', '#26A69A'],
              borderWidth: 2
            }]
          };

          const overviewChartImage = await createChartImage('bar', overallChartData, {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  fontSize: 11
                },
                gridLines: {
                  color: '#E3F2FD'
                }
              }],
              xAxes: [{
                ticks: {
                  fontSize: 11
                },
                gridLines: {
                  color: '#E3F2FD'
                }
              }]
            },
            legend: {
              display: false
            },
            tooltips: {
              callbacks: {
                title(tooltipItems) {
                  return tooltipItems[0].xLabel;
                },
                label(tooltipItem) {
                  const value = tooltipItem.yLabel;
                  const label = tooltipItem.xLabel;
                  if (label.includes('Taxa')) {
                    return `${value}%`;
                  }
                  return `${value}`;
                }
              }
            }
          });

          // Add chart image to PDF
          doc.addImage(overviewChartImage, 'PNG', 14, yPosition, 120, 70);
          yPosition += 85;

          // Label Distribution Chart (Doughnut Chart) with percentages
          if (this.labelDistribution && this.labelDistribution.length > 0) {
            if (yPosition > 180) {
              doc.addPage();
              yPosition = 20;
            }

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(33, 150, 243);
            doc.text('DISTRIBUIÇÃO DE ETIQUETAS', 14, yPosition);
            yPosition += 12;

            const labelChartData = {
              labels: this.labelDistribution.slice(0, 8).map(item => `${item.label} (${item.percentage}%)`),
              datasets: [{
                data: this.labelDistribution.slice(0, 8).map(item => item.count),
                backgroundColor: [
                  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                  '#9966FF', '#FF9F40', '#FF6B6B', '#4ECDC4'
                ],
                borderColor: '#FFFFFF',
                borderWidth: 3
              }]
            };

            const labelChartImage = await createChartImage('doughnut', labelChartData, {
              legend: {
                position: 'right',
                labels: {
                  fontSize: 10,
                  padding: 15,
                  usePointStyle: true
                }
              },
              tooltips: {
                callbacks: {
                  label(tooltipItem, data) {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const label = data.labels[tooltipItem.index];
                    const value = dataset.data[tooltipItem.index];
                    return `${label}: ${value} itens`;
                  }
                }
              }
            });

            // Add chart image to PDF
            doc.addImage(labelChartImage, 'PNG', 14, yPosition, 120, 70);
            yPosition += 85;
          }

          // User Performance Chart (Bar Chart) with participation percentages
          if (this.shouldShowUserDetails && this.userDetails.length > 0) {
            const usersToShow = this.hasUserFilter ? this.filteredUserDetails : this.userDetails;
            
            if (usersToShow.length > 0) {
              if (yPosition > 180) {
                doc.addPage();
                yPosition = 20;
              }

              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(76, 175, 80);
              doc.text('DESEMPENHO DOS UTILIZADORES', 14, yPosition);
              yPosition += 12;

              const userChartData = {
                labels: usersToShow.slice(0, 6).map(user => `${user.username} (${Math.round(user.participation || 0)}%)`),
                datasets: [{
                  label: 'Total de Etiquetas',
                  data: usersToShow.slice(0, 6).map(user => user.totalLabels || 0),
                  backgroundColor: '#4CAF50',
                  borderColor: '#388E3C',
                  borderWidth: 2
                }]
              };

              const userChartImage = await createChartImage('bar', userChartData, {
                scales: {
                  yAxes: [{
                    ticks: {
                      beginAtZero: true,
                      fontSize: 11
                    },
                    gridLines: {
                      color: '#E8F5E8'
                    }
                  }],
                  xAxes: [{
                    ticks: {
                      fontSize: 10,
                      maxRotation: 45
                    },
                    gridLines: {
                      color: '#E8F5E8'
                    }
                  }]
                },
                legend: {
                  display: false
                },
                tooltips: {
                  callbacks: {
                    title(tooltipItems) {
                      return tooltipItems[0].xLabel;
                    },
                    label(tooltipItem) {
                      const value = tooltipItem.yLabel;
                      return `Total de Etiquetas: ${value}`;
                    }
                  }
                }
              });

              // Add chart image to PDF
              doc.addImage(userChartImage, 'PNG', 14, yPosition, 120, 70);
              yPosition += 85;
            }
          }

          // Perspective Response Rate Chart (Bar Chart) with response rates
          if (this.shouldShowPerspectiveDetails && this.perspectiveDetails.length > 0) {
            const perspectivesToShow = (this.hasUserFilter || this.hasPerspectiveFilter) ? this.filteredPerspectiveDetails : this.perspectiveDetails;
            
            if (perspectivesToShow.length > 0) {
              if (yPosition > 180) {
                doc.addPage();
                yPosition = 20;
              }

              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(156, 39, 176);
              doc.text('TAXA DE RESPOSTA DAS PERSPECTIVAS', 14, yPosition);
              yPosition += 12;

              const perspectiveChartData = {
                labels: perspectivesToShow.slice(0, 5).map(p => {
                  const questionPreview = p.question.length > 20 ? p.question.substring(0, 20) + '...' : p.question;
                  return `${questionPreview} (${Math.round(p.responseRate || 0)}%)`;
                }),
                datasets: [{
                  label: 'Taxa de Resposta (%)',
                  data: perspectivesToShow.slice(0, 5).map(p => Math.round(p.responseRate || 0)),
                  backgroundColor: '#9C27B0',
                  borderColor: '#7B1FA2',
                  borderWidth: 2
                }]
              };

              const perspectiveChartImage = await createChartImage('bar', perspectiveChartData, {
                scales: {
                  yAxes: [{
                    ticks: {
                      beginAtZero: true,
                      max: 100,
                      fontSize: 11,
                      callback(value) {
                        return value + '%';
                      }
                    },
                    gridLines: {
                      color: '#F3E5F5'
                    }
                  }],
                  xAxes: [{
                    ticks: {
                      fontSize: 10,
                      maxRotation: 45
                    },
                    gridLines: {
                      color: '#F3E5F5'
                    }
                  }]
                },
                legend: {
                  display: false
                },
                tooltips: {
                  callbacks: {
                    title(tooltipItems) {
                      return tooltipItems[0].xLabel;
                    },
                    label(tooltipItem) {
                      const value = tooltipItem.yLabel;
                      const index = tooltipItem.index;
                      const perspective = perspectivesToShow[index];
                      return `Taxa de Resposta: ${value}% (${perspective.answers} respostas)`;
                    }
                  }
                }
              });

              // Add chart image to PDF
              doc.addImage(perspectiveChartImage, 'PNG', 14, yPosition, 120, 70);
              yPosition += 85;
            }
          }

        } catch (chartError) {
          console.warn('Erro ao criar gráficos:', chartError);
          doc.setFontSize(12);
          doc.setTextColor(255, 87, 34);
          doc.text('Falha na geração de gráficos - continuando apenas com tabelas', 14, yPosition);
          yPosition += 15;
        }

        // Dataset Details Table (if visible)
        if (this.shouldShowDatasetDetails && this.filteredDatasetDetails.length > 0) {
          // Check if we need a new page
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 152, 0);
          doc.text(this.getDatasetDetailsTitle().toUpperCase(), 14, yPosition);
          yPosition += 10;

          const datasetTableData = this.filteredDatasetDetails.slice(0, 20).map(item => [
            item.id || 'N/A',
            (item.text || 'N/A').substring(0, 40) + '...',
            item.discrepancy || 'Não',
            item.participationNumbers || '0/0',
            `${Math.round(item.participationPercentage || 0)}%`,
            item.annotationDetails ? item.annotationDetails.map(a => a.label).slice(0, 2).join(', ') : 'Nenhuma'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['ID', 'Texto', 'Discrepância', 'Participação', '%', 'Etiquetas']],
            body: datasetTableData,
            theme: 'striped',
            headStyles: {
              fillColor: [255, 152, 0],
              textColor: 255,
              fontSize: 9,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 8,
              cellPadding: 3
            },
            columnStyles: {
              0: { cellWidth: 15 },
              1: { cellWidth: 60 },
              2: { cellWidth: 20, halign: 'center' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 15, halign: 'center' },
              5: { cellWidth: 55 }
            }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }

        // User Details Table (if visible)
        if (this.shouldShowUserDetails && this.userDetails.length > 0) {
          // Check if we need a new page
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(76, 175, 80);
          doc.text(this.getUserDetailsTitle().toUpperCase(), 14, yPosition);
          yPosition += 10;

          const usersToShow = this.hasUserFilter ? this.filteredUserDetails : this.userDetails;
          const userTableData = usersToShow.slice(0, 15).map(user => [
            user.username || 'N/A',
            user.textsLabeled?.toString() || '0',
            user.totalLabels?.toString() || '0',
            user.participation ? `${user.participation.toFixed(1)}%` : '0%'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Utilizador', 'Textos Etiquetados', 'Total Etiquetas', 'Participação']],
            body: userTableData,
            theme: 'striped',
            headStyles: {
              fillColor: [76, 175, 80],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: 3
            },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 35, halign: 'center' },
              2: { cellWidth: 35, halign: 'center' },
              3: { cellWidth: 35, halign: 'center' }
            }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Perspective Details Table (if visible)
        if (this.shouldShowPerspectiveDetails && this.perspectiveDetails.length > 0) {
          // Check if we need a new page
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(156, 39, 176);
          doc.text('DETALHES DAS PERSPECTIVAS', 14, yPosition);
          yPosition += 10;

          const perspectivesToShow = (this.hasUserFilter || this.hasPerspectiveFilter) ? this.filteredPerspectiveDetails : this.perspectiveDetails;
          const perspectiveTableData = perspectivesToShow.slice(0, 15).map(perspective => [
            perspective.question ? perspective.question.substring(0, 50) + '...' : 'N/A',
            perspective.type || 'N/A',
            perspective.answers?.toString() || '0',
            `${Math.round(perspective.responseRate || 0)}%`
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Questão', 'Tipo', 'Respostas', 'Taxa de Resposta']],
            body: perspectiveTableData,
            theme: 'striped',
            headStyles: {
              fillColor: [156, 39, 176],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: 3
            },
            columnStyles: {
              0: { cellWidth: 100 },
              1: { cellWidth: 30, halign: 'center' },
              2: { cellWidth: 25, halign: 'center' },
              3: { cellWidth: 35, halign: 'center' }
            }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Label Distribution Table (if visible and has data)
        if (this.labelDistribution && this.labelDistribution.length > 0) {
          // Check if we need a new page
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(33, 150, 243);
          doc.text('DISTRIBUIÇÃO DE ETIQUETAS', 14, yPosition);
          yPosition += 10;

          const labelTableData = this.labelDistribution.slice(0, 15).map(label => [
            label.label || 'N/A',
            label.count?.toString() || '0',
            `${label.percentage || 0}%`
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Etiqueta', 'Contagem', 'Percentagem']],
            body: labelTableData,
            theme: 'striped',
            headStyles: {
              fillColor: [33, 150, 243],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: 3
            },
            columnStyles: {
              0: { cellWidth: 100 },
              1: { cellWidth: 40, halign: 'center' },
              2: { cellWidth: 40, halign: 'center' }
            }
          });
        }

        // Save PDF
        const timestamp = new Date().toISOString().split('T')[0];
        const projectName = (this.project.name || 'projeto').replace(/[^a-z0-9]/gi, '_');
        const filename = `relatorio-estatisticas-${projectName}-${timestamp}.pdf`;
        
        // Use requestAnimationFrame to ensure the PDF generation is complete
        requestAnimationFrame(() => {
          try {
            doc.save(filename);
            // Safe toast notification
            if (this.$toast && typeof this.$toast.success === 'function') {
              this.$toast.success('📊 Relatório PDF com gráficos exportado com sucesso!');
            } else {
              console.log('✅ PDF com gráficos exportado com sucesso');
            }
          } catch (saveError) {
            console.error('Error saving PDF:', saveError);
            // Safe error notification
            if (this.$toast && typeof this.$toast.error === 'function') {
              this.$toast.error('Erro ao baixar o PDF');
            } else {
              console.error('❌ Erro ao baixar o PDF');
              alert('Erro ao baixar o PDF');
            }
          }
        });

        return; // Ensure method exits after successful export

      } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        // Safe error notification
        if (this.$toast && typeof this.$toast.error === 'function') {
          this.$toast.error(`Erro ao exportar: ${error.message}`);
        } else {
          console.error(`❌ Erro ao exportar: ${error.message}`);
          alert(`Erro ao exportar PDF: ${error.message}`);
        }
        return; // Ensure method exits after error
      } finally {
        this.exporting = false
      }
    },

    exportToCSV(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.exporting = true
      try {
        console.log('📊 Iniciando exportação CSV...');
        
        // Verificar se há dados para exportar (qualquer tabela com dados)
        const hasDatasetData = this.shouldShowDatasetDetails && this.filteredDatasetDetails && this.filteredDatasetDetails.length > 0;
        const hasUserData = this.shouldShowUserDetails && this.userDetails && this.userDetails.length > 0;
        const hasPerspectiveData = this.shouldShowPerspectiveDetails && this.perspectiveDetails && this.perspectiveDetails.length > 0;
        const hasLabelData = this.labelDistribution && this.labelDistribution.length > 0;
        
        if (!hasDatasetData && !hasUserData && !hasPerspectiveData && !hasLabelData) {
          throw new Error('Não há dados para exportar em CSV.');
        }
        
        console.log('📊 Dados encontrados:', {
          dataset: hasDatasetData,
          users: hasUserData,
          perspectives: hasPerspectiveData,
          labels: hasLabelData
        });
        
        // Criar conteúdo CSV
        let csvContent = '\uFEFF'; // BOM para UTF-8
        csvContent += `"STATISTICS REPORT - ${this.project.name || 'Projeto'}"\n`;
        csvContent += `"Data: ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}"\n`;
        csvContent += '"\n';
        
        // Active Filters Section
        if (this.hasActiveFilters) {
          csvContent += '"ACTIVE FILTERS:"\n';
          if (this.filters.textFilter) {
            csvContent += `"Text Filter:","${this.filters.textFilter.replace(/"/g, '""')}"\n`;
          }
          if (this.filters.discrepancyFilter) {
            csvContent += `"Discrepancy Filter:","${this.filters.discrepancyFilter}"\n`;
          }
          if (this.filters.userFilter && this.filters.userFilter.length > 0) {
            const usernames = this.filters.userFilter.map(uid => this.getUsernameById(uid)).join(', ');
            csvContent += `"User Filter:","${usernames}"\n`;
          }
          if (this.filters.labelFilter) {
            csvContent += `"Label Filter:","${this.filters.labelFilter}"\n`;
          }
          if (this.filters.perspectiveFilter) {
            const perspective = this.availablePerspectives.find(p => p.id === this.filters.perspectiveFilter);
            csvContent += `"Perspective Filter:","${perspective ? perspective.text.replace(/"/g, '""') : 'N/A'}"\n`;
          }
          if (this.filters.answerFilter) {
            csvContent += `"Answer Filter:","${this.filters.answerFilter.replace(/"/g, '""')}"\n`;
          }
          csvContent += '"\n';
        }
        
        // Overall Statistics Section
        csvContent += '"OVERALL STATISTICS:"\n';
        csvContent += '"Metric","Value"\n';
        
        const totalExamples = hasDatasetData ? this.filteredDatasetDetails.length : (this.stats?.totalExamples || 0);
        const totalLabels = this.stats?.totalLabels || 0;
        const totalUsers = hasUserData ? (this.hasUserFilter ? (this.filteredUserDetails?.length || 0) : (this.userDetails?.length || 0)) : (this.stats?.totalUsers || 0);
        const discrepancyRate = this.stats?.discrepancyRate || 0;
        
        csvContent += `"Total Examples","${totalExamples}"\n`;
        csvContent += `"Total Labels","${totalLabels}"\n`;
        csvContent += `"Total Users","${totalUsers}"\n`;
        csvContent += `"Discrepancy Rate","${discrepancyRate}%"\n`;
        csvContent += '"\n';
        
        // Dataset Details Section (if visible)
        if (hasDatasetData) {
          csvContent += `"${this.getDatasetDetailsTitle().toUpperCase()}:"\n`;
          csvContent += '"ID","Text","Discrepancy","Participation","Participation %","Labels"\n';
          
          console.log('📋 Exportando', this.filteredDatasetDetails.length, 'dataset details');
          this.filteredDatasetDetails.forEach(item => {
            const text = (item.text || 'N/A').replace(/"/g, '""');
            const labels = item.annotationDetails 
              ? item.annotationDetails.map(a => a.label).join('; ').replace(/"/g, '""')
              : 'None';
            
            csvContent += `"${item.id || 'N/A'}","${text}","${item.discrepancy || 'No'}","${item.participationNumbers || '0/0'}","${Math.round(item.participationPercentage || 0)}%","${labels}"\n`;
          });
          csvContent += '"\n';
        }
        
        // User Details Section (if visible)
        if (hasUserData) {
          const usersToShow = this.hasUserFilter ? this.filteredUserDetails : this.userDetails;
          csvContent += `"${this.getUserDetailsTitle().toUpperCase()}:"\n`;
          csvContent += '"Username","Texts Labeled","Total Labels","Participation %"\n';
          
          console.log('👥 Exportando', usersToShow.length, 'user details');
          usersToShow.forEach(user => {
            csvContent += `"${user.username || 'N/A'}","${user.textsLabeled || 0}","${user.totalLabels || 0}","${user.participation ? user.participation.toFixed(1) : 0}%"\n`;
          });
          csvContent += '"\n';
        }
        
        // Perspective Details Section (if visible)
        if (hasPerspectiveData) {
          const perspectivesToShow = (this.hasUserFilter || this.hasPerspectiveFilter) ? this.filteredPerspectiveDetails : this.perspectiveDetails;
          csvContent += '"PERSPECTIVE DETAILS:"\n';
          csvContent += '"Question","Type","Answers","Response Rate %"\n';
          
          console.log('❓ Exportando', perspectivesToShow.length, 'perspective details');
          perspectivesToShow.forEach(perspective => {
            const question = (perspective.question || 'N/A').replace(/"/g, '""');
            csvContent += `"${question}","${perspective.type || 'N/A'}","${perspective.answers || 0}","${Math.round(perspective.responseRate || 0)}%"\n`;
          });
          csvContent += '"\n';
        }
        
        // Label Distribution Section (if has data)
        if (hasLabelData) {
          csvContent += '"LABEL DISTRIBUTION:"\n';
          csvContent += '"Label","Count","Percentage"\n';
          
          console.log('🏷️ Exportando', this.labelDistribution.length, 'label distribution');
          this.labelDistribution.forEach(label => {
            const labelName = (label.label || 'N/A').replace(/"/g, '""');
            csvContent += `"${labelName}","${label.count || 0}","${label.percentage || 0}%"\n`;
          });
          csvContent += '"\n';
        }
        
        console.log('📦 Criando arquivo CSV...');
        
        // Criar e baixar arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        const projectName = (this.project?.name || 'projeto').replace(/[^a-z0-9]/gi, '_');
        const filename = `statistics-${projectName}-${timestamp}.csv`;
        link.download = filename;
        link.style.display = 'none';
        link.setAttribute('target', '_self');
        
        console.log('📁 Nome do arquivo:', filename);
        
        document.body.appendChild(link);
        
        // Use requestAnimationFrame to ensure the DOM is updated
        requestAnimationFrame(() => {
          try {
            link.click();
            console.log('✅ Download iniciado com sucesso');
            
            setTimeout(() => {
              try {
                if (document.body.contains(link)) {
                  document.body.removeChild(link);
                }
                URL.revokeObjectURL(url);
                console.log('🧹 Limpeza concluída');
              } catch (e) {
                console.warn('⚠️ Error cleaning up download link:', e);
              }
            }, 1000);
          } catch (clickError) {
            console.error('❌ Erro ao iniciar download:', clickError);
            throw new Error(`Erro ao baixar arquivo: ${clickError.message}`);
          }
        });
        
        // Safe toast notification
        if (this.$toast && typeof this.$toast.success === 'function') {
          this.$toast.success('Estatísticas exportadas para CSV com sucesso');
        } else {
          console.log('✅ CSV exportado com sucesso');
        }
        return; // Ensure method exits after successful export
        
      } catch (error) {
        console.error('❌ Erro ao gerar CSV:', error);
        // Safe error notification
        if (this.$toast && typeof this.$toast.error === 'function') {
          this.$toast.error(`Erro ao exportar: ${error.message}`);
        } else {
          console.error(`❌ Erro ao exportar: ${error.message}`);
          alert(`Erro ao exportar CSV: ${error.message}`);
        }
        return; // Ensure method exits after error
      } finally {
        this.exporting = false
      }
    },

    generatePDFData() {
      const lines = []
      
      // Header
      lines.push(`STATISTICS REPORT FOR PROJECT: ${this.project.name}`)
      lines.push(`Generated on: ${new Date().toLocaleString()}`)
      lines.push('=' .repeat(60))
      lines.push('')
      
      // Active Filters Summary
      if (this.hasActiveFilters) {
        lines.push('ACTIVE FILTERS:')
        if (this.filters.textFilter) lines.push(`- Text Filter: ${this.filters.textFilter.substring(0, 50)}...`)
        if (this.filters.discrepancyFilter) lines.push(`- Discrepancy Filter: ${this.filters.discrepancyFilter}`)
        if (this.filters.userFilter && this.filters.userFilter.length > 0) {
          const usernames = this.filters.userFilter.map(uid => this.getUsernameById(uid)).join(', ')
          lines.push(`- User Filter: ${usernames}`)
        }
        if (this.filters.labelFilter) lines.push(`- Label Filter: ${this.filters.labelFilter}`)
        if (this.filters.perspectiveFilter) lines.push(`- Perspective Filter: ${this.getPerspectiveNameById(this.filters.perspectiveFilter)}`)
        if (this.filters.answerFilter) lines.push(`- Answer Filter: ${this.filters.answerFilter}`)
        lines.push('')
      }
      
      // Overall Stats
      lines.push('OVERALL STATISTICS:')
      lines.push('-' .repeat(30))
      lines.push(`Total Examples: ${this.shouldShowDatasetDetails ? this.filteredDatasetDetails.length : this.stats.totalExamples}`)
      lines.push(`Total Labels: ${this.stats.totalLabels}`)
      lines.push(`Total Users: ${this.shouldShowUserDetails ? (this.hasUserFilter ? this.filteredUserDetails.length : this.userDetails.length) : this.stats.totalUsers}`)
      lines.push(`Discrepancy Rate: ${this.stats.discrepancyRate}%`)
      lines.push('')
      
      // Dataset Details
      if (this.shouldShowDatasetDetails && this.filteredDatasetDetails.length > 0) {
        lines.push(`${this.getDatasetDetailsTitle().toUpperCase()}:`)
        lines.push('-' .repeat(40))
        this.filteredDatasetDetails.forEach((item, index) => {
          lines.push(`${index + 1}. ${item.text}`)
          lines.push(`   Discrepancy: ${item.discrepancy}`)
          lines.push(`   Participation: ${item.participationNumbers} (${Math.round(item.participationPercentage)}%)`)
          lines.push(`   Annotations: ${item.annotationDetails ? item.annotationDetails.map(a => a.label).join(', ') : 'None'}`)
          lines.push('')
        })
      }
      
      // User Details
      if (this.shouldShowUserDetails && this.userDetails.length > 0) {
        const usersToShow = this.hasUserFilter ? this.filteredUserDetails : this.userDetails
        lines.push(`${this.getUserDetailsTitle().toUpperCase()}:`)
        lines.push('-' .repeat(40))
        usersToShow.forEach((user, index) => {
          lines.push(`${index + 1}. ${user.username}`)
          lines.push(`   Texts Labeled: ${user.textsLabeled}/${user.textsAssigned}`)
          lines.push(`   Total Labels: ${user.totalLabels}`)
          lines.push(`   Participation: ${Math.round(user.participation)}%`)
          lines.push('')
        })
      }
      
      // Perspective Details
      if (this.shouldShowPerspectiveDetails && this.perspectiveDetails.length > 0) {
        const perspectivesToShow = (this.hasUserFilter || this.hasPerspectiveFilter) ? this.filteredPerspectiveDetails : this.perspectiveDetails
        lines.push('PERSPECTIVE DETAILS:')
        lines.push('-' .repeat(40))
        perspectivesToShow.forEach((perspective, index) => {
          lines.push(`${index + 1}. ${perspective.question}`)
          lines.push(`   Type: ${perspective.type}`)
          lines.push(`   Answers: ${perspective.answers}`)
          lines.push(`   Response Rate: ${Math.round(perspective.responseRate)}%`)
          lines.push('')
        })
      }
      
      return lines.join('\n')
    },

    exportStatistics(event) {
      // Keep the old method for backward compatibility, but redirect to CSV
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.exportToCSV(event)
    },

    generateCSVData() {
      const lines = []
      
      // Header
      lines.push(`Statistics Export for Project: ${this.project.name}`)
      lines.push(`Generated on: ${new Date().toLocaleString()}`)
      lines.push('')
      
      // Overall Stats
      lines.push('Overall Statistics')
      lines.push('Metric,Value')
      lines.push(`Total Examples,${this.stats.totalExamples}`)
      lines.push(`Total Labels,${this.stats.totalLabels}`)
      lines.push(`Total Users,${this.stats.totalUsers}`)
      lines.push(`Discrepancy Rate,${this.stats.discrepancyRate}%`)
      lines.push('')
      
      // Label Distribution
      lines.push('Label Distribution')
      lines.push('Label,Count,Percentage')
      this.labelDistribution.forEach(item => {
        lines.push(`${item.label},${item.count},${item.percentage}%`)
      })
      lines.push('')
      
      // User Performance
      lines.push('User Performance')
      lines.push('User,Total Labels,Examples Labeled,Accuracy')
      this.userPerformance.forEach(user => {
        lines.push(`${user.username},${user.totalLabels},${user.examplesLabeled},${user.accuracy}%`)
      })
      
      return lines.join('\n')
    }
  }
}
</script>
