import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { SERVICE_ID, TEMPLATE_ID, USER_ID } from 'src/main';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  contactForm!: FormGroup;

  ngOnInit() {
    this.contactForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      message: new FormControl(null, Validators.required),
    });
  }

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.contactForm.valid) {
      this.sendEmail();
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, completa todos los campos correctamente.',
        icon: 'error',
      });
    }
  }

  public sendEmail() {
    emailjs.send(SERVICE_ID, TEMPLATE_ID, this.contactForm.value, USER_ID).then(
      (result: EmailJSResponseStatus) => {
        this.contactForm.reset();
        Swal.fire({
          title: 'Éxito',
          text: 'El correo electrónico se ha enviado correctamente.',
          icon: 'success',
        });
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al enviar el correo electrónico.',
          icon: 'error',
        });
      }
    );
  }
}
