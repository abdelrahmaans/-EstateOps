import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { BuildingCategory, DeliveryStatus, EastDistrict, FinishingStatus, NileSide, PaymentPlan, Project, Unit, UnitDistrict, UnitStatus, UnitType, WestDistrict } from '../../core/models';
import { ProjectsService } from '../../core/projects.service';
import { UnitFilters, UnitPayload, UnitsService } from '../../core/units.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-units-page',
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ 'units.eyebrow' | t }}</p>
        <h2>{{ 'units.title' | t }}</h2>
      </div>
      <button class="button primary" type="button" (click)="startCreate()">{{ 'units.add' | t }}</button>
    </section>

    <form class="filters wide-filters compact-filters" [formGroup]="filters">
      <select formControlName="projectId" [attr.aria-label]="'units.project' | t">
        <option value="">{{ 'common.allProjects' | t }}</option>
        @for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }
      </select>
      <select formControlName="status" [attr.aria-label]="'units.status' | t">
        <option value="">{{ 'common.allStatuses' | t }}</option>
        @for (status of statuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }
      </select>
      <select formControlName="type" [attr.aria-label]="'units.type' | t">
        <option value="">{{ 'units.allTypes' | t }}</option>
        @for (type of types; track type) { <option [value]="type">{{ typeKey(type) | t }}</option> }
      </select>
      <select formControlName="buildingCategory" [attr.aria-label]="'units.buildingCategory' | t">
        <option value="">{{ 'units.allBuildingCategories' | t }}</option>
        @for (category of buildingCategories; track category) { <option [value]="category">{{ buildingCategoryKey(category) | t }}</option> }
      </select>
      <select formControlName="deliveryStatus" [attr.aria-label]="'units.deliveryStatus' | t">
        <option value="">{{ 'units.allDeliveryStatuses' | t }}</option>
        @for (status of deliveryStatuses; track status) { <option [value]="status">{{ deliveryStatusKey(status) | t }}</option> }
      </select>
      <select formControlName="nileSide" [attr.aria-label]="'units.nileSide' | t" (change)="resetFilterDistrict()">
        <option value="">{{ 'units.allSides' | t }}</option>
        @for (side of nileSides; track side) { <option [value]="side">{{ sideKey(side) | t }}</option> }
      </select>
      <select formControlName="district" [attr.aria-label]="'units.district' | t">
        <option value="">{{ 'units.allDistricts' | t }}</option>
        @for (district of filterDistrictOptions(); track district) { <option [value]="district">{{ districtKey(district) | t }}</option> }
      </select>
      <select formControlName="hasElevator" [attr.aria-label]="'units.elevator' | t">
        <option value="">{{ 'units.allElevators' | t }}</option>
        <option value="yes">{{ 'common.yes' | t }}</option>
        <option value="no">{{ 'common.no' | t }}</option>
      </select>
      <select formControlName="finishing" [attr.aria-label]="'units.finishing' | t">
        <option value="">{{ 'units.allFinishing' | t }}</option>
        @for (finish of finishingOptions; track finish) { <option [value]="finish">{{ finishingKey(finish) | t }}</option> }
      </select>
      <select formControlName="paymentPlan" [attr.aria-label]="'units.paymentPlan' | t">
        <option value="">{{ 'units.allPaymentPlans' | t }}</option>
        @for (plan of paymentPlans; track plan) { <option [value]="plan">{{ paymentKey(plan) | t }}</option> }
      </select>
      <label class="filter-field">
        <span>{{ 'units.minPrice' | t }}</span>
        <input type="number" formControlName="minPrice" [attr.aria-label]="'units.minPrice' | t" />
      </label>
      <label class="filter-field">
        <span>{{ 'units.maxPrice' | t }}</span>
        <input type="number" formControlName="maxPrice" [attr.aria-label]="'units.maxPrice' | t" />
      </label>
      <label class="filter-field">
        <span>{{ 'units.minArea' | t }}</span>
        <input type="number" formControlName="minArea" [attr.aria-label]="'units.minArea' | t" />
      </label>
      <label class="filter-field">
        <span>{{ 'units.maxArea' | t }}</span>
        <input type="number" formControlName="maxArea" [attr.aria-label]="'units.maxArea' | t" />
      </label>
      <button class="button ghost" type="button" (click)="clearFilters()">{{ 'common.clear' | t }}</button>
    </form>

    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ 'units.address' | t }}</th>
            <th>{{ 'units.buildingCategory' | t }}</th>
            <th>{{ 'units.deliveryStatus' | t }}</th>
            <th>{{ 'units.sideDistrict' | t }}</th>
            <th>{{ 'units.area' | t }}</th>
            <th>{{ 'units.price' | t }}</th>
            <th>{{ 'units.finishing' | t }}</th>
            <th>{{ 'units.paymentPlan' | t }}</th>
            <th>{{ 'units.status' | t }}</th>
            <th>{{ 'common.createdAt' | t }}</th>
            <th>{{ 'common.updatedAt' | t }}</th>
            <th>{{ 'common.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (unit of units(); track unit.id) {
            <tr>
              <td>{{ unit.detailed_address ?? ('common.none' | t) }}<br /><small>{{ unit.owner_name ?? ('common.none' | t) }} · {{ unit.owner_phone ?? ('common.none' | t) }}</small></td>
              <td>{{ buildingCategoryKey(unit.building_category) | t }}</td>
              <td>{{ deliveryStatusKey(unit.delivery_status) | t }}</td>
              <td>{{ sideKey(unit.nile_side) | t }}<br /><small>{{ districtKey(unit.district) | t }}</small></td>
              <td>{{ unit.area }}<br /><small>{{ 'units.floor' | t }}: {{ unit.floor ?? ('common.none' | t) }}</small></td>
              <td>{{ unit.price }}</td>
              <td>{{ finishingKey(unit.finishing) | t }}</td>
              <td>{{ paymentKey(unit.payment_plan) | t }}</td>
              <td><span class="badge" [class]="unit.status">{{ statusKey(unit.status) | t }}</span></td>
              <td>{{ unit.created_at | date:'short' }}</td>
              <td>{{ unit.updated_at | date:'short' }}</td>
              <td>
                <div class="table-actions">
                  <button class="icon-button table-action" type="button" (click)="startEdit(unit)" [attr.aria-label]="'common.edit' | t">✎</button>
                  <button class="icon-button table-action danger-action" type="button" (click)="deleteUnit(unit)" [attr.aria-label]="'common.delete' | t">×</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="12" class="empty">{{ 'common.empty' | t }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="'units.formTitle' | t">
        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
          <h3 class="span-2">{{ 'units.formTitle' | t }}</h3>
          <label><span>{{ 'units.project' | t }}</span><select formControlName="project_id">@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select></label>
          <label><span>{{ 'units.type' | t }}</span><select formControlName="type">@for (type of types; track type) { <option [value]="type">{{ typeKey(type) | t }}</option> }</select></label>
          <label><span>{{ 'units.buildingCategory' | t }}</span><select formControlName="building_category">@for (category of buildingCategories; track category) { <option [value]="category">{{ buildingCategoryKey(category) | t }}</option> }</select></label>
          <label><span>{{ 'units.deliveryStatus' | t }}</span><select formControlName="delivery_status">@for (status of deliveryStatuses; track status) { <option [value]="status">{{ deliveryStatusKey(status) | t }}</option> }</select></label>
          <label><span>{{ 'units.status' | t }}</span><select formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }</select></label>
          <label><span>{{ 'units.nileSide' | t }}</span><select formControlName="nile_side" (change)="resetFormDistrict()">@for (side of nileSides; track side) { <option [value]="side">{{ sideKey(side) | t }}</option> }</select></label>
          <label><span>{{ 'units.district' | t }}</span><select formControlName="district">@for (district of formDistrictOptions(); track district) { <option [value]="district">{{ districtKey(district) | t }}</option> }</select></label>
          <label class="span-2"><span>{{ 'units.address' | t }}</span><input formControlName="detailed_address" /></label>
          <label><span>{{ 'units.area' | t }}</span><input type="number" formControlName="area" /></label>
          <label><span>{{ 'units.floor' | t }}</span><input type="number" formControlName="floor" /></label>
          <label><span>{{ 'units.price' | t }}</span><input type="number" formControlName="price" /></label>
          <label><span>{{ 'units.loadPercentage' | t }}</span><input type="number" formControlName="load_percentage" /></label>
          <label><span>{{ 'units.elevator' | t }}</span><select formControlName="has_elevator"><option [ngValue]="true">{{ 'common.yes' | t }}</option><option [ngValue]="false">{{ 'common.no' | t }}</option></select></label>
          <label><span>{{ 'units.finishing' | t }}</span><select formControlName="finishing">@for (finish of finishingOptions; track finish) { <option [value]="finish">{{ finishingKey(finish) | t }}</option> }</select></label>
          <label><span>{{ 'units.paymentPlan' | t }}</span><select formControlName="payment_plan">@for (plan of paymentPlans; track plan) { <option [value]="plan">{{ paymentKey(plan) | t }}</option> }</select></label>
          <label><span>{{ 'units.ownerName' | t }}</span><input formControlName="owner_name" /></label>
          <label><span>{{ 'units.ownerPhone' | t }}</span><input formControlName="owner_phone" /></label>
          <label class="span-2"><span>{{ 'units.notes' | t }}</span><textarea formControlName="notes"></textarea></label>
          <div class="form-actions span-2">
            <button class="button" type="button" (click)="cancel()">{{ 'common.cancel' | t }}</button>
            <button class="button primary" type="submit">{{ 'common.save' | t }}</button>
          </div>
        </form>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitsPage {
  private readonly service = inject(UnitsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly units = signal<Unit[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly editing = signal<Unit | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly statuses: UnitStatus[] = ['available', 'reserved', 'sold'];
  protected readonly types: UnitType[] = ['studio', 'apartment', 'duplex', 'villa', 'office', 'retail'];
  protected readonly buildingCategories: BuildingCategory[] = ['tower', 'building', 'other'];
  protected readonly deliveryStatuses: DeliveryStatus[] = ['under_construction', 'ready_to_deliver'];
  protected readonly nileSides: NileSide[] = ['east', 'west'];
  protected readonly eastDistricts: EastDistrict[] = ['first_district', 'third_district', 'fourth_district', 'fifth_district', 'azhar_district', 'district_13', 'other'];
  protected readonly westDistricts: WestDistrict[] = ['abasiry', 'zohour', 'ramad', 'rawda', 'mokbel', 'ard_el_horreya', 'corniche', 'abdelsalam_aref', 'salah_salem', 'tayaran_behind_stadium', 'other'];
  protected readonly finishingOptions: FinishingStatus[] = ['core_and_shell', 'semi_finished', 'fully_finished', 'super_lux'];
  protected readonly paymentPlans: PaymentPlan[] = ['cash', 'installment'];

  protected readonly filters = this.fb.nonNullable.group({
    projectId: '',
    status: '',
    type: '',
    buildingCategory: '',
    deliveryStatus: '',
    nileSide: '',
    district: '',
    hasElevator: '',
    finishing: '',
    paymentPlan: '',
    minPrice: 0,
    maxPrice: 0,
    minArea: 0,
    maxArea: 0,
  });

  protected readonly form = this.fb.nonNullable.group({
    project_id: '',
    type: 'apartment' as UnitType,
    building_category: 'building' as BuildingCategory,
    delivery_status: 'under_construction' as DeliveryStatus,
    detailed_address: '',
    nile_side: 'east' as NileSide,
    district: 'first_district' as UnitDistrict,
    area: 0,
    floor: 0,
    price: 0,
    status: 'available' as UnitStatus,
    has_elevator: false,
    load_percentage: 0,
    finishing: 'core_and_shell' as FinishingStatus,
    payment_plan: 'cash' as PaymentPlan,
    notes: '',
    owner_phone: '',
    owner_name: '',
  });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.load());
    void this.loadSupport();
    void this.load();
  }

  protected async load(): Promise<void> {
    const raw = this.filters.getRawValue();
    const filters: UnitFilters = {
      projectId: raw.projectId,
      status: raw.status as UnitStatus | '',
      type: raw.type as UnitType | '',
      buildingCategory: raw.buildingCategory as BuildingCategory | '',
      deliveryStatus: raw.deliveryStatus as DeliveryStatus | '',
      nileSide: raw.nileSide as NileSide | '',
      district: raw.district as UnitDistrict | '',
      hasElevator: raw.hasElevator as 'yes' | 'no' | '',
      finishing: raw.finishing as FinishingStatus | '',
      paymentPlan: raw.paymentPlan as PaymentPlan | '',
      minPrice: raw.minPrice || null,
      maxPrice: raw.maxPrice || null,
      minArea: raw.minArea || null,
      maxArea: raw.maxArea || null,
    };

    try {
      this.units.set(await this.service.list(filters));
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected startCreate(): void {
    this.editing.set('new');
    this.form.reset({
      project_id: this.projects()[0]?.id ?? '',
      type: 'apartment',
      building_category: 'building',
      delivery_status: 'under_construction',
      detailed_address: '',
      nile_side: 'east',
      district: 'first_district',
      area: 0,
      floor: 0,
      price: 0,
      status: 'available',
      has_elevator: false,
      load_percentage: 0,
      finishing: 'core_and_shell',
      payment_plan: 'cash',
      notes: '',
      owner_phone: '',
      owner_name: '',
    });
  }

  protected startEdit(unit: Unit): void {
    this.editing.set(unit);
    this.form.setValue({
      project_id: unit.project_id,
      type: unit.type,
      building_category: unit.building_category ?? 'building',
      delivery_status: unit.delivery_status ?? 'under_construction',
      detailed_address: unit.detailed_address ?? '',
      nile_side: unit.nile_side ?? 'east',
      district: unit.district ?? 'first_district',
      area: unit.area,
      floor: unit.floor ?? 0,
      price: unit.price,
      status: unit.status,
      has_elevator: unit.has_elevator,
      load_percentage: unit.load_percentage ?? 0,
      finishing: unit.finishing ?? 'core_and_shell',
      payment_plan: unit.payment_plan ?? 'cash',
      notes: unit.notes ?? '',
      owner_phone: unit.owner_phone ?? '',
      owner_name: unit.owner_name ?? '',
    });
  }

  protected async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: UnitPayload = {
      ...raw,
      detailed_address: raw.detailed_address || null,
      floor: raw.floor || null,
      load_percentage: raw.load_percentage || null,
      notes: raw.notes || null,
      owner_phone: raw.owner_phone || null,
      owner_name: raw.owner_name || null,
    };

    try {
      const editing = this.editing();
      if (editing === 'new') {
        await this.service.create(payload);
        this.resetFilters();
      } else if (editing) {
        await this.service.update(editing.id, payload);
      }
      this.cancel();
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected async deleteUnit(unit: Unit): Promise<void> {
    if (!await this.confirmDialog.confirm()) {
      return;
    }

    try {
      await this.service.remove(unit.id);
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected clearFilters(): void {
    this.resetFilters();
    void this.load();
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected resetFilterDistrict(): void {
    this.filters.controls.district.setValue('');
  }

  protected resetFormDistrict(): void {
    const firstDistrict = this.form.controls.nile_side.value === 'east' ? 'first_district' : 'abasiry';
    this.form.controls.district.setValue(firstDistrict);
  }

  protected formDistrictOptions(): UnitDistrict[] {
    return this.form.controls.nile_side.value === 'east' ? this.eastDistricts : this.westDistricts;
  }

  protected filterDistrictOptions(): UnitDistrict[] {
    if (this.filters.controls.nileSide.value === 'east') {
      return this.eastDistricts;
    }
    if (this.filters.controls.nileSide.value === 'west') {
      return this.westDistricts;
    }
    return [...this.eastDistricts, ...this.westDistricts.filter((district) => district !== 'other')];
  }

  protected statusKey(status: string | null): string { return labelKey('unitStatuses', status); }
  protected typeKey(type: string | null): string { return labelKey('unitTypes', type); }
  protected buildingCategoryKey(category: string | null): string { return labelKey('buildingCategories', category); }
  protected deliveryStatusKey(status: string | null): string { return labelKey('deliveryStatuses', status); }
  protected sideKey(side: string | null): string { return labelKey('nileSides', side); }
  protected districtKey(district: string | null): string { return labelKey('districts', district); }
  protected finishingKey(finishing: string | null): string { return labelKey('finishingStatuses', finishing); }
  protected paymentKey(paymentPlan: string | null): string { return labelKey('paymentPlans', paymentPlan); }

  private async loadSupport(): Promise<void> {
    this.projects.set(await this.projectsService.list());
  }

  private resetFilters(): void {
    this.filters.reset({
      projectId: '',
      status: '',
      type: '',
      buildingCategory: '',
      deliveryStatus: '',
      nileSide: '',
      district: '',
      hasElevator: '',
      finishing: '',
      paymentPlan: '',
      minPrice: 0,
      maxPrice: 0,
      minArea: 0,
      maxArea: 0,
    }, { emitEvent: false });
  }
}
