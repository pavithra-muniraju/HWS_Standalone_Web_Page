import { Component } from '@angular/core';

interface FilterItem {
  label: string;
  count: number;
  selected: boolean;
}

interface ApiItem {
  issue_title: string;
  issue_description: string;
  metadatas: { [key: string]: string };
}
@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})



export class SearchResultsComponent {
  allResults: ApiItem[] = [];
  filteredResults: ApiItem[] = [];

  issueCategoryFilteredData: FilterItem[] = [];
  deptFilteredData: FilterItem[] = [];

  ngOnInit(): void {
    // Mock API data
    this.allResults = this.getMockData();
    this.filteredResults = [...this.allResults];
    this.updateFilterOptions();
  }
  // mock API data
  getMockData(): ApiItem[] {
    return [
      {
        issue_title: 'Engine Seizure',
        issue_description: 'Seized piston and block at zero KMs.',
        metadatas: {
          'Issue Category': 'General',
          'Initiator Dept': 'R&D Design'
        }
      },
      {
        issue_title: 'Fuel Pump Leakage',
        issue_description: 'Leak under pressure.',
        metadatas: {
          'Issue Category': 'General',
          'Initiator Dept': 'Electrical Engineering'
        }
      },
      {
        issue_title: 'Control Unit Overheating',
        issue_description: 'Frequent shutdowns.',
        metadatas: {
          'Issue Category': 'General',
          'Initiator Dept': 'Electrical Engineering'
        }
      }
    ];
  }

  // When checkbox select and unselect
  onFilterChange(): void {
    const selectedCategories = this.issueCategoryFilteredData
      .filter(f => f.selected)
      .map(f => f.label);

    const selectedDepts = this.deptFilteredData
      .filter(f => f.selected)
      .map(f => f.label);

    // Apply filters to main result
    this.filteredResults = this.allResults.filter(item => {
      const category = item.metadatas['Issue Category'];
      const dept = item.metadatas['Initiator Dept'];

      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
      const matchDept = selectedDepts.length === 0 || selectedDepts.includes(dept);

      return matchCategory && matchDept;
    });

    this.updateFilterOptions();
  }

  // Recalculates filter checkbox lists based on current filtered data
  updateFilterOptions(): void {
    const selectedCategories = this.issueCategoryFilteredData.filter(f => f.selected).map(f => f.label);
    const selectedDepts = this.deptFilteredData.filter(f => f.selected).map(f => f.label);

    const categoryCounts: { [key: string]: number } = {};
    const deptCounts: { [key: string]: number } = {};

    this.filteredResults.forEach(item => {
      const category = item.metadatas['Issue Category'];
      const dept = item.metadatas['Initiator Dept'];

      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }

      if (dept) {
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }
    });

    this.issueCategoryFilteredData = Object.entries(categoryCounts).map(([label, count]) => ({
      label,
      count,
      selected: selectedCategories.includes(label)
    }));

    this.deptFilteredData = Object.entries(deptCounts).map(([label, count]) => ({
      label,
      count,
      selected: selectedDepts.includes(label)
    }));
  }


  resetFilters(): void {
    // Clear selected checkboxes
    this.issueCategoryFilteredData.forEach(f => (f.selected = false));
    this.deptFilteredData.forEach(f => (f.selected = false));
    this.filteredResults = [...this.allResults];
    this.updateFilterOptions();
  }
}