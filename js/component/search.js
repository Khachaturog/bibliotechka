class SearchComponent extends HTMLElement {
  connectedCallback() {
  this.innerHTML = `
    <div id="search" class="search">

        <div class="header-wrap-start">
            <header-component></header-component>
        </div>

        <div class="header-wrap-footer">
            <section class="search-badge-wrap">
                <template class="search-group-block">
                    <div class="search-group-block">
                        <h2 class="h3 group-title" style="margin-left: 4px;"></h2>
                        <div class="subgroup-badges"></div>
                    </div>
                </template>
                <template class="search-badge-template">
                    <a href="" class="chip-neutral-label-small"></a>
                </template>
            </section>
        </div>

        <div class="drawer-overlay" onclick="toggleSearch()"></div>

    </div>
      `;
  }
}
customElements.define('search-component', SearchComponent);

