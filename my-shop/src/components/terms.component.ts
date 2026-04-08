import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto py-12 px-6 animate-fade-in">
      <h1 class="text-3xl font-black text-gray-800 mb-8 border-b-2 border-brand-200 pb-4">服務條款與退換貨政策</h1>
      
      <div class="space-y-8 text-gray-600 leading-relaxed">
        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">一、</span>認知與接受條款</h2>
          <p>當您於本網站完成結帳下單時，即表示您已閱讀、瞭解並完全同意接受本服務條款之所有內容。本網站保留隨時修改本條款之權利，建議您於下單前再次確認最新規範。</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">二、</span>代購服務性質說明 (重要)</h2>
          <p>本網站提供之商品多為「海外代購服務」。</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>代購服務屬於台灣消保法所規範之「委任契約」。本網站係接受您的委託，代為向海外廠商進行購買與寄送。</li>
            <li>由於代購性質屬於「依消費者要求所為之客製化給付」，因此不適用消保法第19條之「七天鑑賞期」規定。</li>
            <li>訂單成立並進入採購流程後，除商品遇缺貨/斷貨外，恕無法接受任何理由（如：等待時間過長、尺寸不合、些微色差、個人喜好改變等）要求取消訂單或退換貨。</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">三、</span>商品瑕疵退換貨政策</h2>
          <p>出貨前我們皆會進行嚴格的品質檢查。若您收到的商品仍有「重大瑕疵」或「寄錯商品」，請依下列流程辦理：</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>請務必於**收到包裹（取件日）起 3 日內**，提供「清晰開箱錄影」與「瑕疵照片」聯繫官方客服。</li>
            <li>開箱錄影標準：請從包裹未拆封的完整狀態開始錄影，並清楚拍攝到物流單號、拆箱過程及瑕疵確認，一鏡到底不可剪輯。若無完整開箱影片，恕無法受理退換貨。</li>
            <li>非瑕疵範圍定義：線頭未修剪、極小污點（直徑小於0.5公分）、尺寸誤差（±3公分內）、螢幕色差、材質想像不同、未開眼洞、染料味道等，在國際驗貨標準均屬可接受範圍，不列入瑕疵退換貨標準。</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">四、</span>斷貨與缺貨處理</h2>
          <p>海外商品流動速度極快，若不幸遇到韓國廠商布料短缺或商品斷貨：</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>我們將第一時間透過 Email 或官方 LINE 通知您。</li>
            <li>遇斷貨商品之金額，將協助您辦理指定帳戶之退款。</li>
            <li>若同筆訂單內包含其他已採購到貨之商品，恕無法因部分商品斷貨而要求整筆訂單取消。</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><span class="text-brand-600">五、</span>配送與交期聲明</h2>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>現貨商品：確認收款後，約 2-5 個工作天內寄出。</li>
            <li>預購/代購商品：確認收款後，自海外空運來台需等待約 10-30 個工作天（不含台韓例假日）。</li>
            <li>若遇海關查驗、班機延誤或氣候等不可抗力因素，交期可能順延。若您有急用需求，請於下單前謹慎評估，下單即代表您同意等待。</li>
          </ul>
        </section>
      </div>
    </div
  `
})
export class TermsComponent {}