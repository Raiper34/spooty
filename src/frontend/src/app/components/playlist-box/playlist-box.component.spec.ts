import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistBoxComponent } from './playlist-box.component';

describe('PlaylistListComponent', () => {
  let component: PlaylistBoxComponent;
  let fixture: ComponentFixture<PlaylistBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaylistBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
