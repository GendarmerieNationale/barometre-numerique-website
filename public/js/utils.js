function selectMenuEntry(menuId) {
    let mainMenuLinks = document.querySelectorAll('#main-menu a')
    for (let i = 0; i < mainMenuLinks.length; i++) {
        mainMenuLinks[i].removeAttribute('aria-current')
    }
    if (menuId === "") return
    let selectedEntry = document.getElementById(menuId)
    selectedEntry.setAttribute("aria-current", "page")
}
