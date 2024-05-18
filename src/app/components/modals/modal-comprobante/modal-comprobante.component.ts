import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modal-comprobante',
  templateUrl: './modal-comprobante.component.html',
  styleUrls: ['./modal-comprobante.component.scss']
})
export class ModalComprobanteComponent {
  @Input() laburo: any;
  @Input() pago: any;

}
