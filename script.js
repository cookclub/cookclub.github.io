const API_URL = "https://script.google.com/macros/s/AKfycbycslp8s-4n-Ai72QsVHiUJW3hZcUZ11ji9q2FoK-GYNHJn1_WsEVSI40YbLmEPBtNe/exec";

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_URL}?action=getFormData`)
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        renderForm(data.data);
      } else {
        console.error("Failed to load form data");
      }
    })
    .catch(console.error);
});

function renderForm(formData) {
  const form = document.getElementById("recipeForm");
  form.innerHTML = ""; // Clear if needed

  formData.fields.forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;
    label.htmlFor = field.name;

    let input;
    if (field.type === "text") {
      input = document.createElement("input");
      input.type = "text";
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
    } else if (field.type === "select") {
      input = document.createElement("select");
      field.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        input.appendChild(option);
      });
    }

    input.name = field.name;
    input.id = field.name;

    const div = document.createElement("div");
    div.appendChild(label);
    div.appendChild(document.createElement("br"));
    div.appendChild(input);

    form.appendChild(div);
  });

  // Optional: Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Submit Recipe";
  form.appendChild(submitBtn);
}
