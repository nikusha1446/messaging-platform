import { dom } from './dom.js';

export function initSidebarToggle() {
  dom.sidebarToggle.addEventListener('click', toggleSidebar);
  dom.sidebarOverlay.addEventListener('click', closeSidebar);
}

function toggleSidebar() {
  dom.sidebar.classList.add('active');
  dom.sidebarOverlay.classList.add('active');
}

function closeSidebar() {
  dom.sidebar.classList.remove('active');
  dom.sidebarOverlay.classList.remove('active');
}

export function closeSidebarOnMobile() {
  if (window.innerWidth <= 1080) {
    closeSidebar();
  }
}
