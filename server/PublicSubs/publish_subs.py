import pandas as pd
from pprint import pprint

# tables:
# main, pricing, categories, scripts, about


# df_cols = ['id', 'name', 'billing_date', 'billing_freq', 'icon_url', 'website_url']
# df = pd.DataFrame(columns=df_cols)
#
# row = ['1', 'example', '10-2-2', '0-2-0',
#              'https://cdn.business2community.com/wp-content/uploads/2013/09/best-press-release-example.jpg',
#              'https://www.example.com/']
# df.loc[0] = row
# df.to_csv('main.csv')
# print(df)

# requirement - pip3 install xlrd


df = pd.read_excel('main_table.xlsx')
print(df)


# create subscription from each row:
for i in range(len(df)):
    row = df.iloc[i, :]
    public_sub = {}
    for col in df.columns:
        public_sub[col] = row[col]

    print(public_sub)
