import { Component, OnInit } from '@angular/core';
import { SettingsService, SystemSettings } from '../../../../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings: SystemSettings = {
    barangayName: '',
    barangayCaptain: '',
    contactNumber: '',
  };
  isLoading = true;
  isSaving = false;
  message = '';

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.loadSettings().subscribe({
      next: (data) => {
        this.settings = { ...data };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveSettings(): void {
    this.isSaving = true;
    this.message = '';
    this.settingsService.saveSettings(this.settings).subscribe({
      next: () => {
        this.message = 'Settings saved successfully.';
        this.isSaving = false;
      },
      error: () => {
        this.message = 'Failed to save settings. Please try again.';
        this.isSaving = false;
      }
    });
  }
}
