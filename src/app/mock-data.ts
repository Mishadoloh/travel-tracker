import { Place } from './models/place.model';

export const MOCK_PLACES: Place[] = [
  {
    fsq_id: '1',
    name: 'Ейфелева вежа',
    location: { city: 'Париж', country: 'Франція', formatted_address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris' },
    categories: [{ id: 1, name: 'Пам\'ятка' }],
    rating: 9.8,
    distance: 1200,
    photos: [
      { id: 'p1', prefix: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=', suffix: '&q=80', width: 800, height: 800 }
    ],
    tips: [{ id: 't1', text: 'Найкращий вид на заході сонця!', created_at: new Date().toISOString() }],
    description: 'Символ Парижа та одна з найвідоміших архітектурних пам\'яток світу.',
  },
  {
    fsq_id: '2',
    name: 'Колізей',
    location: { city: 'Рим', country: 'Італія', formatted_address: 'Piazza del Colosseo, 1, 00184 Roma RM' },
    categories: [{ id: 2, name: 'Історична пам\'ятка' }],
    rating: 9.7,
    distance: 500,
    photos: [
      { id: 'p2', prefix: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=', suffix: '&q=80', width: 800, height: 800 }
    ],
    tips: [{ id: 't2', text: 'Краще купувати квитки заздалегідь.', created_at: new Date().toISOString() }],
    description: 'Величезний амфітеатр, де колись проходили гладіаторські бої.',
  },
  {
    fsq_id: '3',
    name: 'Саграда Прізвище',
    location: { city: 'Барселона', country: 'Іспанія', formatted_address: 'C/ de Mallorca, 401, 08013 Barcelona' },
    categories: [{ id: 3, name: 'Собор' }],
    rating: 9.9,
    distance: 2300,
    photos: [
      { id: 'p3', prefix: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=', suffix: '&q=80', width: 800, height: 800 }
    ],
    tips: [{ id: 't3', text: 'Фантастична архітектура Гауді!', created_at: new Date().toISOString() }],
    description: 'Неймовірний собор, будівництво якого триває вже понад 100 років.',
  }
];
