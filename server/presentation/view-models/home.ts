export type HomeNextSession = {
  circleSessionId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
};

export type HomeCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  url: string;
};

export type HomeViewModel = {
  nextSession: HomeNextSession | null;
  calendarEvents: HomeCalendarEvent[];
};
