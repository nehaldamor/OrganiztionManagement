import { InternalServerErrorException, Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class InvitationEmailService {
  async sendEmail(to: string, subject: string, message: string): Promise<void> {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    if (!email || !password) {
      throw new InternalServerErrorException(
        'Email delivery is not configured. Set EMAIL and PASSWORD.',
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: email, pass: password },
    });

    await transporter.sendMail({
      from: email,
      to,
      subject,
      text: message,
    });
  }
}
