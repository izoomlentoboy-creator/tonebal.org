import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              На главную
            </Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-8">Политика конфиденциальности</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Последнее обновление: 4 февраля 2026 г.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора,
              хранения, обработки, использования и защиты персональных данных пользователей
              веб-сервиса ToneBalance (https://tonebal.org) и мобильного приложения ToneBalance
              (далее совместно — «Сервис»).
            </p>
            <p className="mt-4">
              Используя Сервис, вы соглашаетесь с условиями настоящей Политики и даёте согласие
              на обработку персональных данных в соответствии с Федеральным законом от 27.07.2006
              № 152-ФЗ «О персональных данных».
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Оператор персональных данных</h2>
            <p>
              Оператором персональных данных является Правообладатель Сервиса.
            </p>
            <p className="mt-4">
              <strong>Контактные данные для вопросов по защите персональных данных:</strong><br />
              Email: support@tonebal.org
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Собираемые данные</h2>
            <p>Мы собираем следующие категории персональных данных:</p>

            <h3 className="text-lg font-medium mt-4 mb-2">3.1. Данные, предоставляемые пользователем:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Имя и фамилия (при регистрации через социальные сети)</li>
              <li>Адрес электронной почты</li>
              <li>Идентификатор пользователя в социальных сетях (Apple ID, Яндекс ID, ВКонтакте)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">3.2. Данные, собираемые автоматически:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP-адрес</li>
              <li>Тип и версия браузера</li>
              <li>Тип устройства и операционная система</li>
              <li>Дата и время посещения</li>
              <li>Просмотренные страницы и действия в Сервисе</li>
              <li>Прогресс прохождения программ</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">3.3. Данные в мобильном приложении:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Аудиозаписи упражнений (хранятся локально на устройстве)</li>
              <li>Записи дневника голоса (хранятся локально на устройстве)</li>
              <li>Идентификатор устройства</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Цели обработки данных</h2>
            <p>Персональные данные обрабатываются в следующих целях:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Предоставление доступа к функционалу Сервиса</li>
              <li>Идентификация пользователя при авторизации</li>
              <li>Обработка платежей и предоставление кодов доступа</li>
              <li>Отслеживание прогресса прохождения программ</li>
              <li>Техническая поддержка пользователей</li>
              <li>Улучшение качества Сервиса</li>
              <li>Направление информационных сообщений (с согласия пользователя)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Правовые основания обработки</h2>
            <p>Обработка персональных данных осуществляется на следующих основаниях:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Согласие субъекта персональных данных (п. 1 ч. 1 ст. 6 ФЗ № 152-ФЗ)</li>
              <li>Исполнение договора (п. 5 ч. 1 ст. 6 ФЗ № 152-ФЗ)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Хранение и защита данных</h2>
            <p>
              Персональные данные хранятся на защищённых серверах с применением современных
              методов шифрования. Срок хранения данных — до момента удаления аккаунта
              пользователем или до истечения 3 лет с момента последней активности.
            </p>
            <p className="mt-4">
              Для защиты данных применяются следующие меры:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Шифрование передачи данных по протоколу HTTPS/TLS</li>
              <li>Хэширование паролей</li>
              <li>Разграничение доступа к базам данных</li>
              <li>Регулярное резервное копирование</li>
              <li>Мониторинг безопасности</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Передача данных третьим лицам</h2>
            <p>
              Персональные данные могут передаваться следующим категориям получателей:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Платёжные системы:</strong> ЮKassa (ООО «ЮМани») — для обработки платежей</li>
              <li><strong>Провайдеры авторизации:</strong> Apple, Яндекс, ВКонтакте — для идентификации пользователя</li>
              <li><strong>Хостинг-провайдеры:</strong> для хранения данных на серверах</li>
            </ul>
            <p className="mt-4">
              Данные не продаются и не передаются третьим лицам в маркетинговых целях.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Права пользователя</h2>
            <p>В соответствии с законодательством РФ вы имеете право:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Получить информацию об обработке ваших персональных данных</li>
              <li>Требовать уточнения, блокирования или уничтожения данных</li>
              <li>Отозвать согласие на обработку персональных данных</li>
              <li>Обжаловать действия оператора в Роскомнадзор</li>
            </ul>
            <p className="mt-4">
              Для реализации своих прав направьте запрос на email: support@tonebal.org
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Файлы cookie</h2>
            <p>
              Сервис использует файлы cookie для:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Сохранения сессии авторизации</li>
              <li>Запоминания пользовательских настроек</li>
              <li>Аналитики использования Сервиса</li>
            </ul>
            <p className="mt-4">
              Вы можете отключить cookie в настройках браузера, однако это может повлиять
              на функциональность Сервиса.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Данные несовершеннолетних</h2>
            <p>
              Сервис не предназначен для лиц младше 18 лет. Мы не собираем сознательно
              персональные данные несовершеннолетних. Если вам стало известно, что ребёнок
              предоставил нам свои данные, свяжитесь с нами для их удаления.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Изменения в Политике</h2>
            <p>
              Мы оставляем за собой право вносить изменения в настоящую Политику.
              Актуальная версия всегда доступна по адресу: https://tonebal.org/privacy
            </p>
            <p className="mt-4">
              При существенных изменениях мы уведомим пользователей по электронной почте
              или путём размещения уведомления в Сервисе.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Контактная информация</h2>
            <p>
              По вопросам, связанным с обработкой персональных данных:
            </p>
            <ul className="list-none mt-4 space-y-2">
              <li><strong>Email:</strong> support@tonebal.org</li>
              <li><strong>Сайт:</strong> https://tonebal.org</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
