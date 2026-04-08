import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto py-12 px-6 animate-fade-in">
      <h1 class="text-3xl font-black text-gray-800 mb-8 border-b-2 border-brand-200 pb-4">隱私權保護政策</h1>
      
      <div class="space-y-8 text-gray-600 leading-relaxed">
        <p>非常歡迎您光臨本網站，為了讓您能夠安心的使用本網站的各項服務與資訊，特此向您說明本網站的隱私權保護政策，以保障您的權益，請您詳閱下列內容：</p>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">一、</span>個人資料的蒐集、處理及利用方式</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>當您註冊會員、使用購物車結帳或使用客服聯絡等功能時，我們將視服務性質，請您提供必要的個人資料（包含但不限於：姓名、聯絡電話、電子郵件、收件地址等），並在該特定目的範圍內處理及利用。</li>
            <li>於一般瀏覽時，本網站或第三方數據工具（如 Google Analytics 等）可能會自動記錄相關行徑，包括您使用連線設備的 IP 位址、使用時間、使用的瀏覽器、瀏覽及點選資料記錄等，此記錄僅做為我們增進網站服務與行銷評估的內部參考依據，決不對外個別公佈。</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">二、</span>資料之保護與儲存</h2>
          <p>本網站之資料庫存放於具備國際級安全標準的雲端伺服器（如 Google Firebase 等）。伺服器均設有資訊安全設備及必要的防護措施，僅有經過授權之內部人員才能接觸您的個人資料及訂單資訊，相關處理人員皆負有保密義務。</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">三、</span>與第三人共用個人資料之政策 (重要)</h2>
          <p>本網站絕不會任意提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有下列情形者除外：</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>為完成交易與提供服務之必要：我們必須將您的姓名、聯絡電話、收件地址等相關必要資訊，提供給合作之物流業者（如 7-11 賣貨便、全家、宅配公司等）及第三方金流服務機構，以利完成商品配送與款項收付。</li>
            <li>經由您書面或系統操作同意。</li>
            <li>配合司法單位合法的調查，或配合相關職權機關依職務需要之調查或使用。</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">四、</span>Cookie 之使用</h2>
          <p>為了提供您最佳的服務，本網站會在您的電腦中放置並取用我們的 Cookie，若您不願接受 Cookie 的寫入，您可在您使用的瀏覽器功能項中設定隱私權等級為高，即可拒絕 Cookie 的寫入，但可能會導至網站某些功能（如購物車紀錄、保持登入狀態）無法正常執行。</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">五、</span>當事人權利之行使 (個資法規定)</h2>
          <p>依據台灣《個人資料保護法》第三條規定，您就本網站保有之個人資料得行使下列權利：</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>查詢、請求閱覽或請求製給複製本。</li>
            <li>請求補充或更正（需由您適當釋明其原因及事實）。</li>
            <li>請求停止蒐集、處理或利用，以及請求刪除帳號與個人資料。</li>
          </ul>
          <p class="mt-2">若您欲行使上述權利，或對本隱私權政策有任何疑問，請透過本網站下方之客服信箱或官方 LINE 聯繫我們，我們將儘速為您處理。</p>
        </section>
      </div>
    </div>
  `
})
export class PrivacyComponent {}