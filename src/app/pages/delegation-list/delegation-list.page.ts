import { Component, NgZone } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { NavController, PopoverController } from '@ionic/angular'
import { OverlayEventDetail } from '@ionic/core'
import { AirGapMarketWallet } from 'airgap-coin-lib'
import { DelegateEditPopoverComponent } from 'src/app/components/delegate-edit-popover/delegate-edit-popover.component'
import { UIAccountSummary } from 'src/app/models/widgets/display/UIAccountSummary'
import { OperationsProvider } from 'src/app/services/operations/operations'
import { ErrorCategory, handleErrorSentry } from 'src/app/services/sentry-error-handler/sentry-error-handler'
import { isType } from 'src/app/utils/utils'

@Component({
  selector: 'delegation-list',
  templateUrl: './delegation-list.page.html',
  styleUrls: ['./delegation-list.page.scss']
})
export class DelegationListPage {
  public wallet: AirGapMarketWallet

  public delegateeLabel: string
  public delegateeLabelPlural: string

  public areMultipleDelegationsSupported: boolean

  public searchTerm: string = ''

  public currentDelegatees: UIAccountSummary[] = []
  public knownDelegatees: UIAccountSummary[] = []
  public filteredDelegatees: UIAccountSummary[] = []

  private callback: (address: string) => void

  constructor(
    private readonly route: ActivatedRoute,
    private readonly navController: NavController,
    private readonly operations: OperationsProvider,
    private readonly popoverController: PopoverController,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit() {
    if (this.route.snapshot.data.special) {
      const info = this.route.snapshot.data.special
      this.wallet = info.wallet
      this.delegateeLabel = info.delegateeLabel
      this.delegateeLabelPlural = info.delegateeLabelPlural
      this.areMultipleDelegationsSupported = info.areMultipleDelegationsSupported
      this.callback = info.callback

      this.operations.getDelegateesSummary(this.wallet, info.currentDelegatees).then((summary: UIAccountSummary[]) => {
        this.currentDelegatees = summary.filter(summary => info.currentDelegatees.includes(summary.address))
        this.knownDelegatees = summary.filter(summary => !info.currentDelegatees.includes(summary.address))

        this.ngZone.run(() => {
          this.loadMoreItems()
        })
      })
    }
  }

  public async presentPopover(event: any): Promise<void> {
    const popover: HTMLIonPopoverElement = await this.popoverController.create({
      component: DelegateEditPopoverComponent,
      componentProps: {
        delegateeLabel: this.delegateeLabel,
        delegateeLabelPlural: this.delegateeLabelPlural
      },
      event,
      translucent: true
    })

    popover
      .onDidDismiss()
      .then(async ({ data }: OverlayEventDetail<unknown>) => {
        if (isType<{ delegateeAddress: string }>(data, 'delegateeAddress')) {
          this.navigateToDetails(data.delegateeAddress)
        } else {
          console.log('Unknown option selected.')
        }
      })
      .catch(handleErrorSentry(ErrorCategory.IONIC_ALERT))

    return popover.present().catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  public setFilteredItems(searchTerm: string): void {
    if (searchTerm.length === 0) {
      this.filteredDelegatees = this.getKnownDelegatees()
    } else {
      this.filteredDelegatees = this.knownDelegatees.filter((delegatee: UIAccountSummary) => {
        const searchTermLowerCase: string = searchTerm.toLowerCase()
        const hasMatchingAddress: boolean = delegatee.address.toLowerCase().includes(searchTermLowerCase)
        const hasMatchingName: boolean = delegatee.header[0].toLowerCase().includes(searchTermLowerCase)

        return hasMatchingAddress || hasMatchingName
      })
    }
  }

  public loadMoreItems(event?: any): void {
    if (this.searchTerm.length === 0) {
      this.filteredDelegatees = [
        ...this.filteredDelegatees,
        ...this.getKnownDelegatees(Math.max(this.filteredDelegatees.length - 1, 0))
      ].filter((value: UIAccountSummary, index: number, array: UIAccountSummary[]) => array.indexOf(value) === index)
    }

    if (event) {
      event.target.complete()
      if (this.filteredDelegatees.length === this.knownDelegatees.length) {
        event.target.disable = true
      }
    }
  }

  public navigateToDetails(address: string): void {
    this.callback(address)
    this.navController.pop()
  }

  private getKnownDelegatees(startIndex: number = 0, step: number = 10): UIAccountSummary[] {
    return this.knownDelegatees.slice(0, startIndex + step)
  }
}
