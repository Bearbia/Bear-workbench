<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import GlobalSearch from '@/components/GlobalSearch.vue'

const searchRef = ref(null)
function openSearch() { searchRef.value?.show() }
</script>

<template>
  <AppSidebar @search="openSearch" />
  <div class="app-main">
    <AppHeader />
    <main class="app-content">
      <RouterView v-slot="{ Component }">
        <Transition name="route-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
  <GlobalSearch ref="searchRef" />
</template>

<style scoped>
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-content {
  flex: 1;
  overflow-x: hidden;
}
</style>
