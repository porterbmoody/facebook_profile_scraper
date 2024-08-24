#%%

import pandas as pd
pd.set_option('display.max_colwidth', None)

file = 'profile_data.csv'
data = pd.read_csv(file)
data.sort_values('group_profile_url')

# data['profile_url'].str.extract(r'https://www\.facebook\.com/groups/\d{15}/user/(\d{10})/')
# regex = r'(https://www\.facebook\.com/groups/)(\d{15})'
# regex = r'(https://www.facebook.com/groups/\d{15}/user/\d{15}/)'
regex = r'https://www\.facebook\.com/groups/\d{15}/user/(\d+)/'

data['swag_profile'] = 'https://www.facebook.com/profile.php?id=' + data['group_profile_url'].str.extract(regex)
data['equal'] = data['profile_url'] == data['swag_profile']
data
# data.query("equal==False")
#%%

import pandas as pd
import re

pd.set_option('display.max_colwidth', None)

file = 'profile_data.csv'
data = pd.read_csv(file)

def extract_second_10_digit_number(url):
    numbers = re.findall(r'\d{10}', url)
    if len(numbers) >= 2:
        return numbers[1]
    return None

data['second_10_digit_number'] = data['profile_url'].apply(extract_second_10_digit_number)

print(data)


#%%

# data['second_10_digit_number'] = 
# data['profile_url'].str.extract(r'(?:\D|^)(\d{10})(?:\D*\d{10})')
# data['profile_url'].str.extract(r'(https://www.facebook.com/groups/\d{15}/user/\d{15}/)')
data['profile_url'].str.extract(r'https://www\.facebook\.com/groups/\d{15}/user/(\d{10})/')
# data['profile_url'].str.extract(r'(\d{15})')

# data['profile_url'].str.extract(r'(\d{15})')
