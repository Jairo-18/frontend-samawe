import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeeRecipesComponent } from '../../components/see-recipes/see-recipes.component';
import { CreateOrEditRecipeComponent } from '../../components/create-or-edit-recipe/create-or-edit-recipe.component';
import { RecipeWithDetails } from '../../interfaces/recipe.interface';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';

@Component({
  selector: 'app-recipes-general',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    SeeRecipesComponent,
    CreateOrEditRecipeComponent,
    BasePageComponent
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class RecipesGeneralComponent implements AfterViewInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  @ViewChild(SeeRecipesComponent) seeRecipesComponent!: SeeRecipesComponent;
  @ViewChild(CreateOrEditRecipeComponent)
  createOrEditComponent!: CreateOrEditRecipeComponent;

  private readonly _route: ActivatedRoute = inject(ActivatedRoute);

  currentRecipe?: RecipeWithDetails;

  ngAfterViewInit(): void {
    this._route.queryParams.subscribe((params) => {
      if (params['editRecipe']) {
        this.tabGroup.selectedIndex = 1;
      }
    });
  }

  onTabChange(idx: number): void {
    if (idx !== 1) {
      this.currentRecipe = undefined;
      this.createOrEditComponent?.resetForm();
    }
  }

  onEditRecipe(recipe: RecipeWithDetails): void {
    this.currentRecipe = recipe;
    this.tabGroup.selectedIndex = 1;
    this._goToTop();
  }

  onRecipeSaved(): void {
    this.currentRecipe = undefined;
    this.tabGroup.selectedIndex = 0;
    this.seeRecipesComponent?.loadRecipes();
  }

  onRecipeCanceled(): void {
    this.currentRecipe = undefined;
    this.tabGroup.selectedIndex = 0;
  }

  private _goToTop(): void {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

