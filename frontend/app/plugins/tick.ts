// `v-tick="valeur"` : l'élément s'éclaire en vert si la valeur monte, en rouge si elle baisse, puis revient (cours en direct).
// Sur une ligne de tableau, mettre aussi `:key` (symbole) : un tri qui réordonne les lignes ne fait pas flasher la mauvaise.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive<HTMLElement, number | undefined>('tick', {
    updated(el, { value, oldValue }) {
      if (value == null || oldValue == null || value === oldValue) return
      el.classList.remove('tick-up', 'tick-down')
      // Relance l'animation si la valeur rebouge avant la fin de la précédente.
      void el.offsetWidth
      el.classList.add(value > oldValue ? 'tick-up' : 'tick-down')
    },
  })
})
