/**
 * USER SELECTOR COMPONENT
 * Handles member dropdown population and guest form management
 */

class UserSelector {
    constructor() {
      this.members = [];
      this.memberSelect = document.getElementById('member-select');
      
      this.init();
    }
    
    async init() {
      try {
        await this.loadMembers();
        this.populateMemberDropdown();
      } catch (error) {
        console.error('Failed to initialize user selector:', error);
        this.showMemberLoadError();
      }
    }
    
    async loadMembers() {
      try {
        const response = await api.getFormData();
        
        if (response.success && response.data.members) {
          this.members = response.data.members;
          console.log(`✅ Loaded ${this.members.length} members`);
        } else {
          throw new Error(response.message || 'Failed to load members');
        }
      } catch (error) {
        console.error('Error loading members:', error);
        throw error;
      }
    }
    
    populateMemberDropdown() {
      if (!this.memberSelect) return;
      
      // Clear existing options (except the first placeholder)
      while (this.memberSelect.children.length > 1) {
        this.memberSelect.removeChild(this.memberSelect.lastChild);
      }
      
      // Add member options
      this.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.user_id;
        option.textContent = member.display_name;
        option.dataset.discordId = member.discord_id;
        
        this.memberSelect.appendChild(option);
      });
      
      console.log(`✅ Populated member dropdown with ${this.members.length} members`);
    }
    
    showMemberLoadError() {
      if (!this.memberSelect) return;
      
      // Clear existing options
      this.memberSelect.innerHTML = '';
      
      // Add error option
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = 'Error loading members - please refresh';
      errorOption.disabled = true;
      
      this.memberSelect.appendChild(errorOption);
      
      Utils.showToast('Failed to load member list. Please refresh the page.', 'error');
    }
    
    getMemberById(userId) {
      return this.members.find(member => member.user_id === userId);
    }
    
    getMemberByDiscordId(discordId) {
      return this.members.find(member => member.discord_id === discordId);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.userSelector = new UserSelector();
    });
  } else {
    window.userSelector = new UserSelector();
  }