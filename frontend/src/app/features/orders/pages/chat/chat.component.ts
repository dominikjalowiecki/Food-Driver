import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { DataService } from './services/data.service';
import { Scroller, ScrollerModule } from 'primeng/scroller';
import { LazyLoadEvent, MenuItem } from 'primeng/api';
import { JwtService } from '../../../../shared/services/jwt.service';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { ImageUploadComponent } from '../../../../shared/ui/image-upload/image-upload.component';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CreateImage201Response, MessageType } from '../../../../shared/api';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    DividerModule,
    TagModule,
    ImageModule,
    ImageUploadComponent,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    DialogModule,
    ButtonModule,
    TranslatePipe,
    ReactiveFormsModule,
    InfiniteScrollDirective,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private dataService = inject(DataService);
  private jwtService = inject(JwtService);
  types = MessageType;
  userId = this.jwtService.getUserId();
  id = input.required<number>();
  chat = this.dataService.state.chat;
  messages = this.dataService.state.messages;
  result = computed(
    () =>
      this.messages().sort((a, b) => {
        return new Date(a.created).getTime() - new Date(b.created).getTime();
      }) || []
  );
  status = this.dataService.state.status;
  visible = false;
  image: CreateImage201Response | undefined;
  message = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  scroller = viewChild.required<ElementRef<HTMLDivElement>>('scroller');
  previewSrc = '';
  isHistory = false;

  ngOnInit(): void {
    this.dataService.getChat$.next({ id: this.id(), page: 1 });
  }
  ngAfterViewChecked(): void {
    if (!this.isHistory) {
      this.scrollBottom('smooth');
    }
  }
  setImage(image: CreateImage201Response) {
    this.image = image;
    this.visible = false;
  }
  openImageImport() {
    this.visible = true;
  }
  loadMessages() {
    this.isHistory = true;
    if (this.chat()?.currentPage !== this.chat()?.pages) {
      this.dataService.getChat$.next({
        id: this.id(),
        page: (this.chat()?.currentPage || 0) + 1,
      });
    }
  }
  sendMessage() {
    this.isHistory = false;
    this.dataService.createMessage$.next({
      id: this.id(),
      data: {
        message: this.message.getRawValue(),
        idImage: this.image?.idImage,
      },
      imageSrc: this.previewSrc,
    });
    this.message.reset();
  }
  private scrollBottom(behavior: ScrollBehavior) {
    this.scroller()?.nativeElement.scrollTo({
      top: this.scroller()?.nativeElement.scrollHeight,
      behavior,
    });
  }
}
